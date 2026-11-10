import React, { useState } from 'react';
import {
  Upload,
  Maximize2,
  ScanEye,
  Camera,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { DetailFocusMode, PhotoAnalysisResult } from '../types/analysis';
import { PresetSampleItem } from '../data/presetAnalyses';

interface OpticalWorkbenchProps {
  activeImageUrl: string;
  activeFileName: string;
  imageDimensions: { width: number; height: number } | null;
  activePresetId: string | null;
  presets: PresetSampleItem[];
  focusMode: DetailFocusMode;
  customNotes: string;
  isAnalyzing: boolean;
  errorMessage: string | null;
  analysis: PhotoAnalysisResult;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectPreset: (preset: PresetSampleItem) => void;
  onFileSelected: (file: File) => void;
  onFocusModeChange: (mode: DetailFocusMode) => void;
  onCustomNotesChange: (notes: string) => void;
  onRunLiveAnalysis: () => void;
  onOpenLightbox: () => void;
}

const FOCUS_MODES: { id: DetailFocusMode; label: string; hint: string }[] = [
  {
    id: 'complete_forensic',
    label: 'Полный разбор 360°',
    hint: 'Все планы, свет, геометрия и фактуры',
  },
  {
    id: 'portrait_skin_optics',
    label: 'Портрет и микрорельеф кожи',
    hint: 'Анатомия лица, поры, взгляд, ткань',
  },
  {
    id: 'architecture_lighting',
    label: 'Архитектура и перспектива',
    hint: 'Точки схода, бетон/стекло, Кельвины',
  },
  {
    id: 'macro_materiality',
    label: 'Макро и физика поверхности',
    hint: 'Каустика, блики, микротекстуры',
  },
];

export const OpticalWorkbench: React.FC<OpticalWorkbenchProps> = ({
  activeImageUrl,
  activeFileName,
  imageDimensions,
  activePresetId,
  presets,
  focusMode,
  customNotes,
  isAnalyzing,
  errorMessage,
  analysis,
  fileInputRef,
  onSelectPreset,
  onFileSelected,
  onFocusModeChange,
  onCustomNotesChange,
  onRunLiveAnalysis,
  onOpenLightbox,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImgError(false);
      onFileSelected(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImgError(false);
      onFileSelected(file);
    }
  };

  const telemetry = analysis.opticalTelemetry;

  return (
    <section id="workbench" className="scroll-mt-20">
      {/* Editorial Hero Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-zinc-800/80">
        <div className="max-w-3xl">
          <p className="text-xs font-mono text-amber-400/90 tracking-wide mb-2">
            Оптическая деконструкция кадра · Строгий лимит ≤ 4000 знаков · Два 8K-промта
          </p>
          <h1
            className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-50 font-display"
            style={{ textWrap: 'balance' }}
          >
            Точное описание фотографии на английском и синтез парных 8K-промтов без цензуры
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono tabular-nums shrink-0">
          <span>Лимит описания: {analysis.characterCount} / 4000 симв.</span>
          <span aria-hidden="true">·</span>
          <span>Слов: {analysis.wordCount}</span>
          <span aria-hidden="true">·</span>
          <span>Целевое разрешение: 8K UHD (7680×4320)</span>
        </div>
      </div>

      {/* Main 2-Column Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Interactive Photo Inspection Frame + Preset Selector */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-900/70 border border-zinc-800 rounded-xl p-5">
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono truncate">
                <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span className="text-zinc-200 font-medium truncate">{activeFileName}</span>
                {imageDimensions && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {imageDimensions.width}×{imageDimensions.height}px
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onOpenLightbox}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/90 hover:bg-zinc-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  aria-label="Увеличить фотографию на весь экран"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Экран 100%</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Сменить файл</span>
                </button>
              </div>
            </div>

            {/* Viewport Dropzone & Image Preview */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative overflow-hidden rounded-lg border transition-colors bg-zinc-950 flex items-center justify-center min-h-[320px] sm:min-h-[380px] ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/5'
                  : 'border-zinc-800/90'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleInputChange}
                className="sr-only"
                aria-label="Загрузить исходную фотографию"
              />

              {!imgError && activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt={analysis.title || 'Исходная фотография для оптического разбора'}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-[360px] sm:h-[400px] object-contain select-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Camera className="w-10 h-10 text-zinc-600 mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-zinc-300">
                    Исходный кадр готов к оптическому анализу
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Перетащите сюда JPG, PNG или WEBP либо выберите эталонный снимок ниже
                  </p>
                </div>
              )}

              {/* Subtle bottom scrim with optical readout */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 py-3 flex items-center justify-between gap-4 text-xs text-zinc-300 font-mono tabular-nums">
                <span className="truncate">{analysis.title}</span>
                <span className="text-amber-300 shrink-0">
                  {telemetry.estimatedFocalLength} · {telemetry.apertureProfile.split('—')[0].trim()}
                </span>
              </div>
            </div>
          </div>

          {/* Preset Reference Strip */}
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-medium text-zinc-400">
                Эталонные студийные снимки (или перетащите своё фото выше):
              </span>
              <span className="text-xs text-zinc-500 font-mono">3 пресета 8K</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {presets.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setImgError(false);
                      onSelectPreset(preset);
                    }}
                    className={`group flex items-center gap-3 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 border-amber-400/70 text-zinc-100'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="w-12 h-10 rounded overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                      <img
                        src={preset.imageUrl}
                        alt={preset.labelRu}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-zinc-200">
                        {preset.labelRu}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate font-mono">
                        {preset.categoryRu}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Vision Controls & Optical Telemetry */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-900/70 border border-zinc-800 rounded-xl p-5">
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-100 font-display">
                Параметры глубокой деконструкции кадра
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Настройте фокус внимания оптического анализатора перед генерацией английского описания (до 4000 знаков) и двух независимых 8K-промтов.
              </p>
            </div>

            {/* Focus Mode Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Приоритет оптического сканирования
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FOCUS_MODES.map((m) => {
                  const active = focusMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onFocusModeChange(m.id)}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-400/10 border-amber-400 text-zinc-100'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-semibold text-zinc-100 whitespace-nowrap truncate">
                        {m.label}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {m.hint}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes Input */}
            <div>
              <label
                htmlFor="custom-optical-notes"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Дополнительный акцент для промтов (необязательно)
              </label>
              <input
                id="custom-optical-notes"
                type="text"
                value={customNotes}
                onChange={(e) => onCustomNotesChange(e.target.value)}
                placeholder="Напр.: сохранить точную текстуру кожи, блики на линзе, 8K raw sensor..."
                className="w-full px-3 py-2 text-xs text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Primary Live AI Vision Trigger */}
            <div className="pt-1">
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={onRunLiveAnalysis}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Сканирование микротекстур и синтез 8K-промтов...</span>
                  </>
                ) : (
                  <>
                    <ScanEye className="w-4 h-4" aria-hidden="true" />
                    <span>Анализировать фото через AI Vision (≤ 4000 знаков + 2 промта)</span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-3 p-3 rounded-lg bg-red-950/50 border border-red-800/80 text-xs text-red-200 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Optical Telemetry Readout Table */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
              <span className="font-medium text-zinc-300">Оптическая телеметрия кадра</span>
              <span className="font-mono tabular-nums text-zinc-400">EXIF Reconstruction</span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-mono tabular-nums">
              <div>
                <dt className="text-zinc-400 text-[11px]">Фокусное расстояние</dt>
                <dd className="text-zinc-200 font-medium truncate">{telemetry.estimatedFocalLength}</dd>
              </div>
              <div>
                <dt className="text-zinc-400 text-[11px]">Диафрагма и ГРИП</dt>
                <dd className="text-zinc-200 font-medium truncate">{telemetry.apertureProfile}</dd>
              </div>
              <div>
                <dt className="text-zinc-400 text-[11px]">Световой контраст</dt>
                <dd className="text-zinc-200 font-medium truncate">{telemetry.lightingRatio}</dd>
              </div>
              <div>
                <dt className="text-zinc-400 text-[11px]">Цветовая температура</dt>
                <dd className="text-zinc-200 font-medium truncate">{telemetry.colorTemperatureKelvin}</dd>
              </div>
            </dl>

            {/* Dominant Chromatic Palette Swatches */}
            <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400 whitespace-nowrap shrink-0">
                Палитра кадра (HEX):
              </span>
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-zinc-300 tabular-nums">
                {telemetry.dominantPaletteHex.map((hex) => (
                  <span key={hex} className="inline-flex items-center gap-1 whitespace-nowrap">
                    <span
                      className="w-3 h-3 rounded-xs border border-zinc-700 inline-block"
                      style={{ backgroundColor: hex }}
                      aria-hidden="true"
                    />
                    <span>{hex}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
