import React, { useState } from 'react';
import { Copy, Check, Scissors, RotateCcw } from 'lucide-react';
import { DescriptionSection } from '../types/analysis';
import {
  MAX_DESCRIPTION_CHARS,
  enforceDescriptionLimit,
  countWords,
} from '../utils/promptFormatter';

interface DescriptionPanelProps {
  descriptionEn: string;
  sections: DescriptionSection[];
  onUpdateDescription: (newText: string) => void;
  onResetDescription: () => void;
}

type ViewTab = 'continuous' | 'structured' | 'editor';

export const DescriptionPanel: React.FC<DescriptionPanelProps> = ({
  descriptionEn,
  sections,
  onUpdateDescription,
  onResetDescription,
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('continuous');
  const [copied, setCopied] = useState(false);

  const charCount = descriptionEn.length;
  const wordCount = countWords(descriptionEn);
  const fillPercent = Math.min(100, Math.round((charCount / MAX_DESCRIPTION_CHARS) * 100));
  const isWithinBudget = charCount <= MAX_DESCRIPTION_CHARS;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(descriptionEn);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = descriptionEn;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section id="description" className="scroll-mt-20 pt-10 border-t border-zinc-800/80">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-mono text-amber-400/90 mb-1">
            01. Forensic Visual Specification · English Language · Строгий контроль длины ≤ 4000 знаков
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 font-display">
            Сверхподробное описание фотографии на английском языке
          </h2>
        </div>

        {/* Interactive View Switcher (Segmented Controls) */}
        <div
          role="tablist"
          aria-label="Режим отображения описания"
          className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'continuous'}
            onClick={() => setActiveTab('continuous')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'continuous'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Полный текст (EN)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'structured'}
            onClick={() => setActiveTab('structured')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'structured'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            По 4 секциям ({sections.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'editor'}
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Редактор текста
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 sm:p-6">
        {/* Top Meter & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-zinc-800/80">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums mb-1.5">
              <span className="text-zinc-300">
                Объём текста: <strong className="text-amber-300">{charCount}</strong> из {MAX_DESCRIPTION_CHARS} знаков ({fillPercent}%)
              </span>
              <span className="text-zinc-400">
                {wordCount} слов · {isWithinBudget ? 'Лимит ≤ 4000 соблюдён' : 'Превышение лимита'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-transform duration-150 origin-left ${
                  isWithinBudget ? 'bg-amber-400' : 'bg-red-500'
                }`}
                style={{ transform: `scaleX(${fillPercent / 100})` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'editor' && (
              <>
                <button
                  type="button"
                  onClick={() => onUpdateDescription(enforceDescriptionLimit(descriptionEn, MAX_DESCRIPTION_CHARS))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Обрезать до 4000</span>
                </button>
                <button
                  type="button"
                  onClick={onResetDescription}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-800/70 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Сбросить</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Описание скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Копировать описание (EN)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'continuous' && (
          <div className="pt-1">
            <div className="font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-200 whitespace-pre-line select-all">
              {descriptionEn}
            </div>
          </div>
        )}

        {activeTab === 'structured' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="pb-4 border-b border-zinc-800/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-400 mb-2">
                    <span className="font-semibold text-zinc-100">
                      0{idx + 1}. {sec.titleRu}
                    </span>
                    <span className="font-mono text-[11px] text-amber-400/90">
                      {sec.titleEn}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-300 font-mono">
                    {sec.contentEn}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono tabular-nums">
                  <span>Символов в блоке: {sec.contentEn.length}</span>
                  <span>Слов: {countWords(sec.contentEn)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'editor' && (
          <div>
            <label htmlFor="description-en-editor" className="sr-only">
              Редактировать английское описание фотографии
            </label>
            <textarea
              id="description-en-editor"
              rows={12}
              value={descriptionEn}
              onChange={(e) =>
                onUpdateDescription(e.target.value.slice(0, MAX_DESCRIPTION_CHARS))
              }
              className="w-full p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-amber-400"
            />
            <p className="text-xs text-zinc-400 mt-2 font-mono tabular-nums">
              Поле автоматически удерживает верхний предел в {MAX_DESCRIPTION_CHARS} знаков. Осталось доступно:{' '}
              {Math.max(0, MAX_DESCRIPTION_CHARS - charCount)} симв.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
