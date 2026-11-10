import React, { useState } from 'react';
import { Copy, Check, Download, Sliders, Sparkles } from 'lucide-react';
import {
  PhotoAnalysisResult,
  TargetEngineId,
} from '../types/analysis';
import {
  PromptModifierConfig,
  buildFinalPrompt,
  computeLexicalDivergence,
  countWords,
} from '../utils/promptFormatter';

interface DualPromptMatrixProps {
  analysis: PhotoAnalysisResult;
  aspectRatio: string;
  config: PromptModifierConfig;
  onUpdateConfig: (partial: Partial<PromptModifierConfig>) => void;
}

const TARGET_ENGINES: {
  id: TargetEngineId;
  label: string;
  models: string;
}[] = [
  {
    id: 'universal',
    label: 'Универсальный (Все ИИ)',
    models: 'Grok · Gemini · Claude · ChatGPT · Flux',
  },
  {
    id: 'grok',
    label: 'Grok Aurora 8K Direct',
    models: 'xAI Grok-2 / Aurora Unfiltered Raw',
  },
  {
    id: 'gemini_claude_gpt',
    label: 'Gemini · Claude · ChatGPT',
    models: 'Imagen 3 · GPT-4o Vision · Claude',
  },
  {
    id: 'flux_midjourney',
    label: 'Flux.1 Pro · Midjourney v6.1',
    models: 'Raw Photometric + AR Parameters',
  },
];

export const DualPromptMatrix: React.FC<DualPromptMatrixProps> = ({
  analysis,
  aspectRatio,
  config,
  onUpdateConfig,
}) => {
  const [copiedSlot, setCopiedSlot] = useState<'A' | 'B' | 'BOTH' | null>(null);
  const [customOverrideA, setCustomOverrideA] = useState<string | null>(null);
  const [customOverrideB, setCustomOverrideB] = useState<string | null>(null);

  const synthesizedA = buildFinalPrompt(
    analysis.promptVariantA.baseTextEn,
    'A',
    { ...config, aspectRatioLabel: aspectRatio },
    analysis.opticalTelemetry
  );

  const synthesizedB = buildFinalPrompt(
    analysis.promptVariantB.baseTextEn,
    'B',
    { ...config, aspectRatioLabel: aspectRatio },
    analysis.opticalTelemetry
  );

  const finalPromptA = customOverrideA !== null ? customOverrideA : synthesizedA;
  const finalPromptB = customOverrideB !== null ? customOverrideB : synthesizedB;

  const divergence = computeLexicalDivergence(finalPromptA, finalPromptB);

  const copyText = async (text: string, slot: 'A' | 'B' | 'BOTH') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedSlot(slot);
    setTimeout(() => setCopiedSlot(null), 1800);
  };

  const handleDownloadReport = () => {
    const content = [
      `OPTICSPEC 8K — FORENSIC PHOTOGRAPH DECONSTRUCTION & DUAL PROMPT SHEET`,
      `Title: ${analysis.title}`,
      `Timestamp: ${analysis.timestamp}`,
      `Description Length: ${analysis.detailedDescriptionEn.length} / 4000 chars`,
      `Lexical Divergence Between Prompts: ${divergence.divergencePercent}%`,
      ``,
      `====================================================================`,
      `1. DETAILED ENGLISH DESCRIPTION (<= 4000 CHARACTERS)`,
      `====================================================================`,
      analysis.detailedDescriptionEn,
      ``,
      `====================================================================`,
      `2. PROMPT VARIANT #1 — NARRATIVE & OPTICAL PROSE (ENGLISH, 8K RAW)`,
      `====================================================================`,
      finalPromptA,
      ``,
      `====================================================================`,
      `3. PROMPT VARIANT #2 — TECHNICAL PHOTOMETRIC MATRIX (ALTERNATIVE VOCABULARY, 8K RAW)`,
      `====================================================================`,
      finalPromptB,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `opticspec-8k-${analysis.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="prompts" className="scroll-mt-20 pt-10 border-t border-zinc-800/80">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono text-amber-400/90 mb-1">
            02. Dual 8K Reconstruction Prompts · Разные слова и синтаксис · Без цензуры и сглаживания
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 font-display">
            Два независимых промта на английском для генерации идентичного кадра в 8K
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              copyText(
                `PROMPT 1 (NARRATIVE OPTICAL 8K):\n${finalPromptA}\n\nPROMPT 2 (TECHNICAL PHOTOMETRIC 8K):\n${finalPromptB}`,
                'BOTH'
              )
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedSlot === 'BOTH' ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Оба промта скопированы</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Копировать оба промта</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Скачать спецификацию (.TXT)</span>
          </button>
        </div>
      </div>

      {/* Control Strip: Target AI Profile & 8K Raw Modifiers */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span>Профиль целевой нейросети:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 flex-1 lg:max-w-4xl">
            {TARGET_ENGINES.map((engine) => {
              const active = config.targetEngine === engine.id;
              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => {
                    setCustomOverrideA(null);
                    setCustomOverrideB(null);
                    onUpdateConfig({ targetEngine: engine.id });
                  }}
                  className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-400/10 border-amber-400 text-zinc-100'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-semibold text-zinc-100 whitespace-nowrap truncate">
                    {engine.label}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono truncate">
                    {engine.models}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Modifiers + Lexical Uniqueness Telemetry */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCustomOverrideA(null);
                setCustomOverrideB(null);
                onUpdateConfig({ enforce8kUhd: !config.enforce8kUhd });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                config.enforce8kUhd
                  ? 'bg-amber-400/15 border-amber-400/70 text-amber-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              {config.enforce8kUhd ? '✓ ' : ''}Разрешение 8K UHD (7680×4320)
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomOverrideA(null);
                setCustomOverrideB(null);
                onUpdateConfig({ unfilteredRawFidelity: !config.unfilteredRawFidelity });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                config.unfilteredRawFidelity
                  ? 'bg-amber-400/15 border-amber-400/70 text-amber-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              {config.unfilteredRawFidelity ? '✓ ' : ''}Без цензуры и ретуши (Direct Raw Sensor)
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomOverrideA(null);
                setCustomOverrideB(null);
                onUpdateConfig({ preserveExactGeometry: !config.preserveExactGeometry });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                config.preserveExactGeometry
                  ? 'bg-amber-400/15 border-amber-400/70 text-amber-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              {config.preserveExactGeometry ? '✓ ' : ''}Строгая геометрия кадра 1:1
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomOverrideA(null);
                setCustomOverrideB(null);
                onUpdateConfig({ includeOpticalExif: !config.includeOpticalExif });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                config.includeOpticalExif
                  ? 'bg-amber-400/15 border-amber-400/70 text-amber-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              {config.includeOpticalExif ? '✓ ' : ''}Оптические EXIF-линзы
            </button>
          </div>

          {/* Lexical Divergence Verification Metric */}
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-zinc-300 bg-zinc-950/90 px-3.5 py-2 rounded-lg border border-zinc-800 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>
              Лексическое различие промтов:{' '}
              <strong className="text-amber-300">{divergence.divergencePercent}%</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-zinc-400">
              Уник. терминов: {divergence.uniqueWordsA} vs {divergence.uniqueWordsB}
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side 2-Column Prompt Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Prompt Variant A */}
        <article className="flex flex-col justify-between bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 sm:p-6">
          <div>
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-zinc-800/80">
              <div>
                <div className="text-xs font-mono text-amber-400 mb-1">
                  PROMPT VARIANT #1 · {analysis.promptVariantA.styleTagEn}
                </div>
                <h3 className="text-base font-bold text-zinc-100 font-display">
                  {analysis.promptVariantA.labelRu}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {analysis.promptVariantA.subtitleRu}
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyText(finalPromptA, 'A')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedSlot === 'A' ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Копировать Промт №1</span>
                  </>
                )}
              </button>
            </div>

            <label htmlFor="prompt-variant-a-textarea" className="sr-only">
              Текст первого промта на английском языке
            </label>
            <textarea
              id="prompt-variant-a-textarea"
              rows={11}
              value={finalPromptA}
              onChange={(e) => setCustomOverrideA(e.target.value)}
              className="w-full p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 font-mono tabular-nums">
            <span>
              Длина: <strong className="text-zinc-200">{finalPromptA.length}</strong> знаков ·{' '}
              {countWords(finalPromptA)} слов
            </span>
            <span>Лексика A: академический оптический нарратив</span>
          </div>
        </article>

        {/* Prompt Variant B */}
        <article className="flex flex-col justify-between bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 sm:p-6">
          <div>
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-zinc-800/80">
              <div>
                <div className="text-xs font-mono text-amber-400 mb-1">
                  PROMPT VARIANT #2 · {analysis.promptVariantB.styleTagEn}
                </div>
                <h3 className="text-base font-bold text-zinc-100 font-display">
                  {analysis.promptVariantB.labelRu}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {analysis.promptVariantB.subtitleRu}
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyText(finalPromptB, 'B')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedSlot === 'B' ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Копировать Промт №2</span>
                  </>
                )}
              </button>
            </div>

            <label htmlFor="prompt-variant-b-textarea" className="sr-only">
              Текст второго промта на английском языке с альтернативной лексикой
            </label>
            <textarea
              id="prompt-variant-b-textarea"
              rows={11}
              value={finalPromptB}
              onChange={(e) => setCustomOverrideB(e.target.value)}
              className="w-full p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 font-mono tabular-nums">
            <span>
              Длина: <strong className="text-zinc-200">{finalPromptB.length}</strong> знаков ·{' '}
              {countWords(finalPromptB)} слов
            </span>
            <span>Лексика B: фотометрические дескрипторы</span>
          </div>
        </article>
      </div>
    </section>
  );
};
