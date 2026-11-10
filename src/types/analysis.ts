export type TargetEngineId =
  | 'universal'
  | 'grok'
  | 'gemini_claude_gpt'
  | 'flux_midjourney';

export type DetailFocusMode =
  | 'complete_forensic'
  | 'portrait_skin_optics'
  | 'architecture_lighting'
  | 'macro_materiality';

export interface PromptModifierOptions {
  targetEngine: TargetEngineId;
  enforce8kUhd: boolean;
  unfilteredRawFidelity: boolean;
  preserveExactGeometry: boolean;
  includeOpticalExif: boolean;
}

export interface DescriptionSection {
  id: string;
  titleRu: string;
  titleEn: string;
  contentEn: string;
}

export interface OpticalTelemetry {
  estimatedFocalLength: string;
  apertureProfile: string;
  lightingRatio: string;
  colorTemperatureKelvin: string;
  dynamicRangeStops: string;
  dominantPaletteHex: string[];
}

export interface PhotoAnalysisResult {
  id: string;
  title: string;
  timestamp: string;
  imagePreviewUrl?: string;
  detailedDescriptionEn: string;
  characterCount: number;
  wordCount: number;
  sections: DescriptionSection[];
  promptVariantA: {
    labelRu: string;
    subtitleRu: string;
    styleTagEn: string;
    baseTextEn: string;
  };
  promptVariantB: {
    labelRu: string;
    subtitleRu: string;
    styleTagEn: string;
    baseTextEn: string;
  };
  opticalTelemetry: OpticalTelemetry;
}
