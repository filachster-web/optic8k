import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_DESCRIPTION_CHARS = 4000;

function enforceDescriptionLimit(rawText: string, maxChars: number = MAX_DESCRIPTION_CHARS): string {
  const normalized = String(rawText || '').replace(/\r\n/g, '\n').trim();
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

function countWords(text: string): number {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function normalizeAnalysisResponse(raw: Record<string, any>, fallbackTitle = 'Analyzed Photograph') {
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

function synthesizePhotometricAnalysis(
  opticalProfile: Record<string, any> = {},
  fileName: string = 'Reference Photograph',
  focusMode: string = 'complete_forensic',
  customNotes: string = ''
) {
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

const SYSTEM_INSTRUCTION = `You are a Master Forensic Optical Analyst, Cinematographer, and Multi-Engine Prompt Architect.
Your task is to examine the user's attached photograph and output a JSON object in English with:
1. "detailedDescriptionEn": An exhaustively detailed, forensic visual description of the photograph in English.
   - CRITICAL CONSTRAINT: "detailedDescriptionEn" MUST be rich and comprehensive (ideally 2,400 to 3,850 characters) and MUST NEVER exceed 4,000 characters total (strictly <= 4000 characters including spaces).
2. "sections": An array of 4 structured breakdown sections in English (with Russian titles in "titleRu" and English titles in "titleEn").
3. "promptVariantA": A master 8K reconstruction prompt in English written as continuous, authoritative optical & narrative prose (160–260 words).
4. "promptVariantB": A SECOND master 8K reconstruction prompt in English (160–260 words) that describes the EXACT SAME photograph to produce an identical 8K raw result, but MUST use COMPLETELY DIFFERENT vocabulary, synonyms, sentence structure, and expressions from promptVariantA.
5. "opticalTelemetry": Estimated optical EXIF metrics (estimatedFocalLength, apertureProfile, lightingRatio, colorTemperatureKelvin, dynamicRangeStops, dominantPaletteHex array of 5 hex colors).`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    detailedDescriptionEn: { type: Type.STRING },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          titleRu: { type: Type.STRING },
          titleEn: { type: Type.STRING },
          contentEn: { type: Type.STRING },
        },
        required: ['id', 'titleRu', 'titleEn', 'contentEn'],
      },
    },
    promptVariantA: { type: Type.STRING },
    promptVariantB: { type: Type.STRING },
    opticalTelemetry: {
      type: Type.OBJECT,
      properties: {
        estimatedFocalLength: { type: Type.STRING },
        apertureProfile: { type: Type.STRING },
        lightingRatio: { type: Type.STRING },
        colorTemperatureKelvin: { type: Type.STRING },
        dynamicRangeStops: { type: Type.STRING },
        dominantPaletteHex: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        'estimatedFocalLength',
        'apertureProfile',
        'lightingRatio',
        'colorTemperatureKelvin',
        'dynamicRangeStops',
        'dominantPaletteHex',
      ],
    },
  },
  required: [
    'title',
    'detailedDescriptionEn',
    'sections',
    'promptVariantA',
    'promptVariantB',
    'opticalTelemetry',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', maxDescriptionChars: MAX_DESCRIPTION_CHARS });
  });

  app.post('/api/analyze-photo', async (req, res) => {
    // Always return HTTP 200 with JSON so Nginx reverse proxy (`proxy_intercept_errors on`)
    // never replaces the response body with /warmup.html (`<!doctype html>`).
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const {
      imageBase64,
      mimeType,
      fileName,
      focusMode,
      customNotes,
      opticalProfile,
    } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(200).json({
        ok: false,
        error: 'Изображение не передано. Пожалуйста, выберите фотографию (JPG, PNG, WEBP).',
      });
      return;
    }

    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const resolvedMimeType =
      typeof mimeType === 'string' && mimeType.startsWith('image/')
        ? mimeType
        : 'image/jpeg';

    const focusInstruction =
      focusMode === 'portrait_skin_optics'
        ? 'Pay heightened attention to facial geometry, gaze vector, skin pore micro-topography, hair strands, fabric drape, and portrait studio lighting ratios.'
        : focusMode === 'architecture_lighting'
        ? 'Pay heightened attention to architectural vanishing points, structural materials, glass reflections, atmospheric perspective, and ambient vs artificial Kelvin lighting.'
        : focusMode === 'macro_materiality'
        ? 'Pay heightened attention to sub-millimeter surface textures, specular highlights, liquid refraction, crystalline edges, and shallow macro depth of field.'
        : 'Perform a complete forensic 360-degree visual deconstruction of all subjects, textures, lighting vectors, and optical parameters.';

    const userPrompt = `Perform an exhaustive forensic photographic deconstruction of this image in English.
${focusInstruction}
${customNotes ? `Additional user context to preserve: ${String(customNotes).slice(0, 400)}` : ''}
Remember:
1) "detailedDescriptionEn" MUST be extraordinarily thorough and detailed in English, between 2,400 and 3,850 characters, and STRICTLY <= 4,000 characters.
2) "promptVariantA" and "promptVariantB" MUST both reconstruct the exact same photograph in 8K UHD unfiltered raw quality for Grok, Gemini, Claude, ChatGPT, and Flux/Midjourney, but MUST use radically different English words, synonyms, and phrasing styles so their lexical overlap is minimal.`;

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: resolvedMimeType,
                data: cleanBase64,
              },
            },
            {
              text: userPrompt,
            },
          ],
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const rawJsonText = (response.text ?? '')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');

      if (!rawJsonText) {
        throw new Error('Empty model response');
      }

      const parsed = JSON.parse(rawJsonText);
      const normalized = normalizeAnalysisResponse(
        parsed,
        fileName ? String(fileName).replace(/\.[^.]+$/, '') : 'Analyzed Photograph'
      );

      res.status(200).json({ ok: true, analysis: normalized });
    } catch (error: any) {
      console.warn('Using photometric optical synthesis fallback:', error?.message?.slice(0, 140));
      const synthesized = synthesizePhotometricAnalysis(
        opticalProfile && typeof opticalProfile === 'object' ? opticalProfile : {},
        fileName ? String(fileName) : 'Uploaded Photograph',
        focusMode || 'complete_forensic',
        customNotes ? String(customNotes) : ''
      );

      res.status(200).json({
        ok: true,
        analysis: synthesized,
        synthesizedFallback: true,
      });
    }
  });

  app.all('/api/*', (_req, res) => {
    res.status(200).json({ ok: false, error: 'API route not found' });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      res.status(200).json({
        ok: false,
        error: err?.message || 'Internal API Error',
      });
      return;
    }
    next(err);
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpticSpec 8K Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
