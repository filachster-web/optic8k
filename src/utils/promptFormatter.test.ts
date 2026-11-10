import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_DESCRIPTION_CHARS,
  enforceDescriptionLimit,
  computeLexicalDivergence,
  buildFinalPrompt,
  normalizeAnalysisResponse,
  safeParseJsonResponse,
} from './promptFormatter';

test('enforceDescriptionLimit preserves strings under 4000 characters', () => {
  const input = 'A high-resolution studio portrait with dramatic side illumination and crisp micro-textures.';
  const result = enforceDescriptionLimit(input);
  assert.equal(result, input);
  assert.ok(result.length <= MAX_DESCRIPTION_CHARS);
});

test('enforceDescriptionLimit strictly caps descriptions over 4000 characters at a clean sentence boundary', () => {
  const sentence = 'The subject stands in a dimly lit brutalist concrete gallery while directional tungsten beams graze the textured basalt floor. ';
  const longText = sentence.repeat(40);
  assert.ok(longText.length > MAX_DESCRIPTION_CHARS);

  const capped = enforceDescriptionLimit(longText, MAX_DESCRIPTION_CHARS);
  assert.ok(
    capped.length <= MAX_DESCRIPTION_CHARS,
    `Expected length <= 4000, got ${capped.length}`
  );
  assert.ok(capped.endsWith('.'), 'Expected truncated description to end cleanly with a period');
});

test('computeLexicalDivergence confirms high lexical differentiation between distinct prompts', () => {
  const promptA =
    'A weathered horologist leans over a scarred walnut workbench, examining an exposed brass escapement wheel through a monocular jeweler loupe under soft diffused key illumination.';
  const promptB =
    'Elderly artisan watchmaker in profile, inspecting intricate golden chronograph gears with brass ocular magnifier, chiaroscuro studio softbox lighting, charcoal backdrop, hyper-detailed skin pores.';

  const stats = computeLexicalDivergence(promptA, promptB);
  assert.ok(stats.divergencePercent >= 75, `Expected divergence >= 75%, got ${stats.divergencePercent}%`);
  assert.ok(stats.uniqueWordsA > 10);
  assert.ok(stats.uniqueWordsB > 10);
});

test('buildFinalPrompt produces two distinct 8K unfiltered prompts for Variant A and Variant B', () => {
  const config = {
    targetEngine: 'universal' as const,
    enforce8kUhd: true,
    unfilteredRawFidelity: true,
    preserveExactGeometry: true,
    includeOpticalExif: true,
  };

  const finalA = buildFinalPrompt(
    'An elderly watchmaker inspecting a brass chronograph movement.',
    'A',
    config,
    { estimatedFocalLength: '50mm', apertureProfile: 'f/1.8', colorTemperatureKelvin: '5000K' }
  );

  const finalB = buildFinalPrompt(
    'Senior horologist examining exposed gilded mechanical timepiece caliber.',
    'B',
    config,
    { estimatedFocalLength: '50mm', apertureProfile: 'f/1.8', colorTemperatureKelvin: '5000K' }
  );

  assert.ok(finalA.includes('8K UHD'));
  assert.ok(finalB.includes('8K Ultra-HD'));
  assert.notEqual(finalA, finalB);

  const divergence = computeLexicalDivergence(finalA, finalB);
  assert.ok(divergence.divergencePercent >= 70, `Expected divergence >= 70%, got ${divergence.divergencePercent}%`);
});

test('normalizeAnalysisResponse guarantees <= 4000 chars and populates both prompt variants', () => {
  const oversizedText = 'Detailed forensic photographic observation of light and shadow. '.repeat(80);
  const normalized = normalizeAnalysisResponse({
    title: 'Test Frame',
    detailedDescriptionEn: oversizedText,
    promptVariantA: 'First distinct English prompt for 8K generation.',
    promptVariantB: 'Second distinct English prompt using alternative vocabulary.',
  });

  assert.ok(normalized.detailedDescriptionEn.length <= 4000);
  assert.equal(normalized.characterCount, normalized.detailedDescriptionEn.length);
  assert.ok(normalized.wordCount > 0);
  assert.ok(normalized.promptVariantA.baseTextEn.includes('First distinct'));
  assert.ok(normalized.promptVariantB.baseTextEn.includes('Second distinct'));
});

test('safeParseJsonResponse intercepts <!doctype html> without throwing SyntaxError', () => {
  const htmlResponse = '<!doctype html>\n<html lang="ru"><head><title>App</title></head><body></body></html>';
  const result = safeParseJsonResponse(htmlResponse);
  assert.equal(result.ok, false);
  assert.equal(result.isHtmlFallback, true);
  assert.equal(result.data, null);

  const validJson = '```json\n{"title": "Studio Frame", "detailedDescriptionEn": "Crisp light."}\n```';
  const validResult = safeParseJsonResponse(validJson);
  assert.equal(validResult.ok, true);
  assert.equal(validResult.isHtmlFallback, false);
  assert.equal(validResult.data?.title, 'Studio Frame');
});
