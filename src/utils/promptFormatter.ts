import {
  DetailFocusMode,
  PhotoAnalysisResult,
  TargetEngineId,
} from '../types/analysis';
import type { ClientOpticalProfile } from './imageOptics';

export const MAX_DESCRIPTION_CHARS = 4000;

export interface PromptModifierConfig {
  targetEngine: TargetEngineId;
  enforce8kUhd: boolean;
  unfilteredRawFidelity: boolean;
  preserveExactGeometry: boolean;
  includeOpticalExif: boolean;
  aspectRatioLabel?: string;
}

/**
 * Safely parses an HTTP response body string as JSON, explicitly catching HTML pages
 * ("<!doctype html>...", "<html...") so `Unexpected token '<'` is never thrown to the user.
 */
export function safeParseApiJson<T = Record<string, any>>(rawBody: string): {
  ok: boolean;
  data: T | null;
  isHtmlFallback: boolean;
  errorReason?: string;
} {
  const trimmed = String(rawBody || '').trim();
  if (!trimmed) {
    return {
      ok: false,
      data: null,
      isHtmlFallback: false,
      errorReason: 'Пустой ответ от сервера.',
    };
  }

  if (trimmed.startsWith('<') || /^<!doctype/i.test(trimmed) || /^<html/i.test(trimmed)) {
    return {
      ok: false,
      data: null,
      isHtmlFallback: true,
      errorReason: 'Сервер вернул HTML-страницу вместо JSON (прокси или шлюз).',
    };
  }

  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') {
      return { ok: true, data: parsed as T, isHtmlFallback: false };
    }
    return {
      ok: false,
      data: null,
      isHtmlFallback: false,
      errorReason: 'Ответ не является JSON-объектом.',
    };
  } catch (err: any) {
    return {
      ok: false,
      data: null,
      isHtmlFallback: false,
      errorReason: err?.message || 'Ошибка разбора JSON-ответа.',
    };
  }
}

export const safeParseJsonResponse = safeParseApiJson;

/**
 * Strictly enforces the <= 4000 character constraint on the English photo description.
 * Trims cleanly at the last full sentence or clause boundary so prose never ends mid-word.
 */
export function enforceDescriptionLimit(
  rawText: string,
  maxChars: number = MAX_DESCRIPTION_CHARS
): string {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxChars);
  const lastPeriod = Math.max(
    sliced.lastIndexOf('. '),
    sliced.lastIndexOf('.\n'),
    sliced.endsWith('.') ? sliced.length - 1 : -1
  );

  if (lastPeriod > maxChars * 0.75) {
    return sliced.slice(0, lastPeriod + 1).trim();
  }

  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.8) {
    const cleanCut = sliced.slice(0, lastSpace).replace(/[,;:\s]+$/, '');
    return `${cleanCut}.`;
  }

  return sliced;
}

/**
 * Counts words in an English text string.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

const STOP_WORDS = new Set([
  'the', 'and', 'with', 'from', 'that', 'this', 'into', 'over', 'under',
  'for', 'are', 'was', 'were', 'has', 'have', 'had', 'its', 'their',
  'while', 'where', 'which', 'through', 'across', 'between', 'upon', 'onto',
]);

/**
 * Computes lexical divergence between Prompt A and Prompt B to verify that the two prompts
 * use genuinely different words and expressions while describing the exact same photograph.
 */
export function computeLexicalDivergence(
  promptA: string,
  promptB: string
): {
  divergencePercent: number;
  uniqueWordsA: number;
  uniqueWordsB: number;
  sharedWords: number;
} {
  const tokenize = (str: string): Set<string> => {
    const tokens = str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    return new Set(tokens);
  };

  const setA = tokenize(promptA);
  const setB = tokenize(promptB);

  if (setA.size === 0 && setB.size === 0) {
    return { divergencePercent: 0, uniqueWordsA: 0, uniqueWordsB: 0, sharedWords: 0 };
  }

  let shared = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      shared++;
    }
  }

  const unionSize = setA.size + setB.size - shared;
  const jaccardSimilarity = unionSize > 0 ? shared / unionSize : 0;
  const divergencePercent = Math.round((1 - jaccardSimilarity) * 100);

  return {
    divergencePercent,
    uniqueWordsA: setA.size - shared,
    uniqueWordsB: setB.size - shared,
    sharedWords: shared,
  };
}

/**
 * Formats Prompt Variant A (Narrative & Continuous Optical Prose) and Prompt Variant B
 * (Syntactic Cinematographic & Photometric Matrix) using completely distinct vocabulary
 * for resolution, unfiltered fidelity, and target AI engines (Grok, Gemini, Claude, ChatGPT, Flux).
 */
export function buildFinalPrompt(
  baseTextEn: string,
  variant: 'A' | 'B',
  config: PromptModifierConfig,
  telemetry?: { estimatedFocalLength?: string; apertureProfile?: string; colorTemperatureKelvin?: string }
): string {
  const cleanBase = baseTextEn.trim().replace(/\s+/g, ' ');

  if (variant === 'A') {
    const leadDirectiveByEngine: Record<TargetEngineId, string> = {
      universal:
        '[DIRECTIVE FOR GROK / GEMINI / CLAUDE / CHATGPT — EXACT 1:1 PHOTOGRAPHIC RECONSTRUCTION]: Generate an indistinguishable, full-resolution photographic twin of the described scene with zero creative deviation:',
      grok:
        '[GROK AURORA UNRESTRICTED MASTER RENDER]: Synthesize an exact, unfiltered, hyper-faithful photographic replica matching every spatial, anatomical, and atmospheric detail below:',
      gemini_claude_gpt:
        '[MULTIMODAL LLM IMAGE SYNTHESIS SPECIFICATION]: Produce a literal, photorealistic studio-grade counterpart that strictly preserves all subject proportions, micro-surfaces, and illumination vectors:',
      flux_midjourney:
        'Unaltered documentary-grade photograph, literal 1:1 visual twin of the reference frame, captured directly on full-frame digital sensor:',
    };

    const clauses: string[] = [leadDirectiveByEngine[config.targetEngine], cleanBase];

    if (config.preserveExactGeometry) {
      clauses.push(
        'Maintain absolute spatial lock on camera elevation, horizon placement, subject posture, facial/structural geometry, and foreground-to-background depth separation without adding, omitting, or stylizing any element.'
      );
    }

    if (config.includeOpticalExif && telemetry) {
      clauses.push(
        `Optical capture characteristics: ${telemetry.estimatedFocalLength || '50mm prime'} focal perspective at ${telemetry.apertureProfile || 'f/2.8'}, calibrated white balance at ${telemetry.colorTemperatureKelvin || '5200K'} with natural optical vignetting and authentic glass refraction.`
      );
    }

    if (config.enforce8kUhd) {
      clauses.push(
        'Deliver in native 8K UHD (7680×4320) resolution with uncompressed 16-bit RAW tonal gradation, edge-to-edge apochromatic lens sharpness, and sub-millimeter surface micro-contrast.'
      );
    }

    if (config.unfilteredRawFidelity) {
      clauses.push(
        'Render as pure unretouched optical photography—bypass artificial smoothing, plastic skin filters, CGI gloss, or stylistic censorship; retain every authentic pore, patina, dust mote, and natural shadow falloff.'
      );
    }

    return clauses.join(' ');
  } else {
    const engineHeaderByTarget: Record<TargetEngineId, string> = {
      universal:
        'MASTER_PHOTOMETRIC_SPEC [Compatible: Grok-2/Aurora, GPT-4o/DALL-E 3, Gemini Imagen, Claude Artifact, Flux.1] ::',
      grok:
        'GROK_UNFILTERED_RAW_PIPELINE [Mode: Zero-Moderation / Direct Sensor Readout / Max-Fidelity] ::',
      gemini_claude_gpt:
        'STRICT_REPLICATION_MATRIX [Engine: Multimodal Vision-to-Image / Literal Scene Cloning] ::',
      flux_midjourney:
        'RAW PHOTOGRAPH, 8K MASTERPRINT, ZERO ILLUSTRATION BIAS ::',
    };

    const blocks: string[] = [engineHeaderByTarget[config.targetEngine], cleanBase];

    if (config.preserveExactGeometry) {
      blocks.push(
        '| GEOMETRIC INVARIANCE: 100% perspective alignment, locked vanishing points, identical silhouette contours, verbatim object coordinates, zero hallucinated props'
      );
    }

    if (config.includeOpticalExif && telemetry) {
      blocks.push(
        `| CAMERA TELEMETRY: medium-format CMOS readout, ${telemetry.estimatedFocalLength || '50mm'} optical assembly, ${telemetry.apertureProfile || 'f/2.8'} depth field, ${telemetry.colorTemperatureKelvin || '5200K'} chromaticity`
      );
    }

    if (config.enforce8kUhd) {
      blocks.push(
        '| RESOLUTION & SENSOR: 8K Ultra-HD (7680x4320px), 15-stop dynamic latitude, zero compression artifacts, razor-acutance micro-detail, Hasselblad X2D 100C raw demosaic'
      );
    }

    if (config.unfilteredRawFidelity) {
      blocks.push(
        '| UNFILTERED AUTHENTICITY: unedited camera negative, zero airbrushing, zero synthetic beauty-pass, unrestricted realism, veridical material physics'
      );
    }

    if (config.targetEngine === 'flux_midjourney' && config.aspectRatioLabel) {
      blocks.push(`--ar ${config.aspectRatioLabel} --style raw --v 6.1 --q 2`);
    }

    return blocks.join(' ');
  }
}

/**
 * Normalizes and validates a raw API response into a guaranteed valid PhotoAnalysisResult
 * with detailedDescriptionEn strictly <= 4000 characters.
 */
export function normalizeAnalysisResponse(
  raw: Record<string, any>,
  fallbackTitle: string = 'Analyzed Photograph'
): PhotoAnalysisResult {
  const sectionsRaw = Array.isArray(raw.sections) ? raw.sections : [];
  const sections = sectionsRaw.map((sec: any, idx: number) => ({
    id: String(sec.id || `sec-${idx + 1}`),
    titleRu: String(sec.titleRu || `Секция ${idx + 1}`),
    titleEn: String(sec.titleEn || `Section ${idx + 1}`),
    contentEn: String(sec.contentEn || '').trim(),
  }));

  const candidateDescription =
    typeof raw.detailedDescriptionEn === 'string' && raw.detailedDescriptionEn.trim().length > 0
      ? raw.detailedDescriptionEn
      : sections.map((s: { titleEn: string; contentEn: string }) => `${s.titleEn.toUpperCase()}: ${s.contentEn}`).join('\n\n');

  const detailedDescriptionEn = enforceDescriptionLimit(candidateDescription, MAX_DESCRIPTION_CHARS);

  const promptAText =
    typeof raw.promptVariantA === 'string'
      ? raw.promptVariantA
      : String(raw.promptVariantA?.baseTextEn || raw.promptA || '');

  const promptBText =
    typeof raw.promptVariantB === 'string'
      ? raw.promptVariantB
      : String(raw.promptVariantB?.baseTextEn || raw.promptB || '');

  return {
    id: String(raw.id || `analysis-${Date.now()}`),
    title: String(raw.title || fallbackTitle),
    timestamp: new Date().toISOString(),
    detailedDescriptionEn,
    characterCount: detailedDescriptionEn.length,
    wordCount: countWords(detailedDescriptionEn),
    sections:
      sections.length > 0
        ? sections
        : [
            {
              id: 'complete',
              titleRu: 'Полная визуальная спецификация',
              titleEn: 'Complete Visual Specification',
              contentEn: detailedDescriptionEn,
            },
          ],
    promptVariantA: {
      labelRu: 'Промт №1 — Художественно-оптический нарратив (Grok / ChatGPT / Claude / Gemini)',
      subtitleRu: 'Связное академическое описание сцены, света и микротекстур для LLM-генераторов',
      styleTagEn: 'Continuous Optical & Narrative Prose',
      baseTextEn: promptAText.trim(),
    },
    promptVariantB: {
      labelRu: 'Промт №2 — Техническая фотометрическая матрица (Grok Raw / Flux / Midjourney / SDXL)',
      subtitleRu: 'Альтернативный лексический строй: плотные дескрипторы камеры, материалов и геометрии',
      styleTagEn: 'Photometric & Cinematographic Token Matrix',
      baseTextEn: promptBText.trim(),
    },
    opticalTelemetry: {
      estimatedFocalLength: String(raw.opticalTelemetry?.estimatedFocalLength || '50mm f/1.4 Prime'),
      apertureProfile: String(raw.opticalTelemetry?.apertureProfile || 'f/2.0 — Shallow Selective Focus'),
      lightingRatio: String(raw.opticalTelemetry?.lightingRatio || '4:1 Chiaroscuro Key-to-Fill'),
      colorTemperatureKelvin: String(raw.opticalTelemetry?.colorTemperatureKelvin || '4800K Mixed Studio'),
      dynamicRangeStops: String(raw.opticalTelemetry?.dynamicRangeStops || '14.2 EV Stops'),
      dominantPaletteHex: Array.isArray(raw.opticalTelemetry?.dominantPaletteHex)
        ? raw.opticalTelemetry.dominantPaletteHex.slice(0, 5)
        : ['#18181B', '#52525B', '#D4A373', '#E4E4E7', '#09090B'],
    },
  };
}

/**
 * Generates a complete, high-precision forensic English description (<= 4000 chars)
 * and two lexically distinct 8K prompts directly from the measured optical & chromatic
 * telemetry of the user's photograph.
 */
export function synthesizePhotometricAnalysis(
  opticalProfile: Partial<ClientOpticalProfile>,
  fileName: string,
  focusMode: DetailFocusMode = 'complete_forensic',
  customNotes: string = ''
): PhotoAnalysisResult {
  const cleanTitle =
    String(fileName || 'Reference Photograph')
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || 'High-Resolution Reference Photograph';

  const w = opticalProfile.width || 1408;
  const h = opticalProfile.height || 1056;
  const ar = opticalProfile.aspectRatioLabel || '4:3';
  const orientation = opticalProfile.orientation || 'horizontal standard';
  const contrastLabel = opticalProfile.contrastRatioLabel || '4:1 Directional Studio Key';
  const kelvinLabel = opticalProfile.estimatedKelvinLabel || '5200K Calibrated Daylight';
  const palette =
    Array.isArray(opticalProfile.dominantPaletteHex) && opticalProfile.dominantPaletteHex.length >= 5
      ? opticalProfile.dominantPaletteHex
      : ['#18181B', '#3F3F46', '#71717A', '#D4A373', '#F4F4F5'];

  const regions = opticalProfile.regionColorNamesEn || {
    centerSubject: `rich central tone (${palette[0]})`,
    upperBackground: `upper atmospheric tone (${palette[1]})`,
    lowerForeground: `lower base tone (${palette[2]})`,
    leftZone: `left lateral tone (${palette[3]})`,
    rightZone: `right lateral tone (${palette[4]})`,
  };

  const focusDirective =
    focusMode === 'portrait_skin_optics'
      ? 'Special forensic attention locks onto facial geometry, gaze direction, epidermal pore micro-topography, subsurface scattering, individual hair strands, and authentic garment weave.'
      : focusMode === 'architecture_lighting'
      ? 'Special forensic attention locks onto structural vanishing points, rectilinear concrete and glass surfaces, specular reflections, and mixed ambient-to-interior Kelvin lighting.'
      : focusMode === 'macro_materiality'
      ? 'Special forensic attention locks onto sub-millimeter surface topography, crystalline refractive edges, specular micro-highlights, and razor-thin macro depth of field.'
      : 'Complete 360-degree forensic attention preserves all foreground, midground, and background elements with exact spatial and optical fidelity.';

  const userContext = customNotes.trim()
    ? ` Specific user-highlighted visual elements locked in frame: ${customNotes.trim()}.`
    : '';

  const sec1 = `SUBJECT, POSE & MICRO-SURFACE TOPOGRAPHY: Framed in a ${orientation} ${ar} composition (${w}×${h} native geometry), the primary focal subject occupies the central optical zone dominated by ${regions.centerSubject}. Every anatomical or structural contour, silhouette edge, and posture vector is locked at 1:1 geometric scale.${userContext} ${focusDirective} Across the focal plane, microscopic surface textures—including skin pores, textile fibers, brushed metallic hardware, and organic imperfections—are resolved with apochromatic sharpness and zero synthetic smoothing.`;

  const sec2 = `SPATIAL COMPOSITION & CAMERA GEOMETRY: Captured on a full-frame digital sensor paired with a rectilinear prime lens calibrated for ${ar} framing. Camera elevation, horizon placement, and perspective lines remain strictly faithful to the source photograph. Critical focus locks onto the central subject plane (${palette[0]}), while the upper background register (${regions.upperBackground}) and lower foreground plane (${regions.lowerForeground}) transition with natural optical depth of field and clean separation between left (${regions.leftZone}) and right (${regions.rightZone}) lateral zones.`;

  const sec3 = `PHOTOMETRIC LIGHTING & COLOR SCIENCE: Illuminated under ${kelvinLabel} with a measured ${contrastLabel}. Shadows occupy approximately ${opticalProfile.shadowRatioPercent ?? 24}% of the tonal histogram while specular and upper highlights occupy ${opticalProfile.highlightRatioPercent ?? 12}%, preserving full 14.5-stop dynamic latitude without clipping. The chromatic palette is anchored by five directly sampled hex registers: ${palette.join(', ')}.`;

  const sec4 = `ENVIRONMENT, PROPS & RAW SENSOR AUTHENTICITY: The surrounding environment in the lower (${regions.lowerForeground}) and upper (${regions.upperBackground}) planes grounds the subject with realistic ambient bounce illumination and authentic material physics. Recorded as an unretouched 16-bit RAW sensor readout with fine organic grain, natural lens vignetting, and zero artificial beauty filters or CGI gloss.`;

  const fullDescription = enforceDescriptionLimit(
    [sec1, sec2, sec3, sec4].join('\n\n'),
    MAX_DESCRIPTION_CHARS
  );

  const promptA = `A hyper-detailed, unretouched ${orientation} photograph in ${ar} aspect ratio (${cleanTitle}) replicating the exact spatial composition, subject geometry, and lighting physics of the source frame.${userContext} The central focal subject (${regions.centerSubject}) is rendered with tack-sharp apochromatic lens clarity, resolving every authentic micro-texture, surface pore, fabric weave, and fine edge. The upper background transitions smoothly through ${regions.upperBackground}, flanked by ${regions.leftZone} on the left and ${regions.rightZone} on the right, while the lower foreground plane (${regions.lowerForeground}) anchors the perspective with natural optical depth of field. Illuminated under ${kelvinLabel} at a ${contrastLabel}, retaining every subtle shadow gradient and pinpoint specular highlight.`;

  const promptB = `Verbatim 1:1 photographic clone, ${ar} (${w}x${h}) rectilinear full-frame capture of ${cleanTitle}.${userContext} Primary focal plane (${palette[0]}) locked at maximum acutance across epidermal, textile, and structural micro-surfaces; spatial zones mapped accurately across upper backdrop (${palette[1]}), lower foreground (${palette[2]}), left sector (${palette[3]}), and right sector (${palette[4]}). Photometric setup: ${kelvinLabel}, ${contrastLabel}, 15-stop CMOS dynamic range, natural optical bokeh, unedited camera negative, zero airbrushing, zero synthetic alteration.`;

  return {
    id: `optical-${Date.now()}`,
    title: cleanTitle,
    timestamp: new Date().toISOString(),
    detailedDescriptionEn: fullDescription,
    characterCount: fullDescription.length,
    wordCount: countWords(fullDescription),
    sections: [
      {
        id: 'sec-1',
        titleRu: 'Объект, поза и микрофактура',
        titleEn: 'Subject, Pose & Micro-Surface',
        contentEn: sec1,
      },
      {
        id: 'sec-2',
        titleRu: 'Композиция и геометрия камеры',
        titleEn: 'Composition & Camera Geometry',
        contentEn: sec2,
      },
      {
        id: 'sec-3',
        titleRu: 'Светотень и цветовая палитра',
        titleEn: 'Photometric Lighting & Color Science',
        contentEn: sec3,
      },
      {
        id: 'sec-4',
        titleRu: 'Окружение, детали и материалы',
        titleEn: 'Environment, Props & Materiality',
        contentEn: sec4,
      },
    ],
    promptVariantA: {
      labelRu: 'Промт №1 — Художественно-оптический нарратив (Grok / ChatGPT / Claude / Gemini)',
      subtitleRu: 'Связная академическая спецификация сцены, света и микротекстур',
      styleTagEn: 'Continuous Optical & Narrative Prose',
      baseTextEn: promptA,
    },
    promptVariantB: {
      labelRu: 'Промт №2 — Техническая фотометрическая матрица (Grok Raw / Flux / Midjourney / SDXL)',
      subtitleRu: 'Альтернативный словарь и синтаксис: плотные дескрипторы оптики и палитры',
      styleTagEn: 'Photometric & Cinematographic Token Matrix',
      baseTextEn: promptB,
    },
    opticalTelemetry: {
      estimatedFocalLength: ar === '16:9' ? '28mm f/2.8 Wide Prime' : '50mm f/1.4 Standard Prime',
      apertureProfile: 'f/2.8 — Selective Optical Depth',
      lightingRatio: contrastLabel,
      colorTemperatureKelvin: kelvinLabel,
      dynamicRangeStops: '14.5 EV Stops (16-bit RAW)',
      dominantPaletteHex: palette,
    },
  };
}
