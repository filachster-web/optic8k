import React from 'react';
import { Upload } from 'lucide-react';

interface TopBarProps {
  onTriggerUpload: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onTriggerUpload }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#workbench"
        className="text-lg font-bold tracking-tight text-zinc-100 font-display whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        OpticSpec 8K
      </a>

      {/* Zone 2: 4 concise single-line text navigation links */}
      <nav
        aria-label="Основная навигация"
        className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400"
      >
        <a
          href="#workbench"
          className="hover:text-zinc-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Оптический стенд
        </a>
        <a
          href="#description"
          className="hover:text-zinc-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Описание (≤ 4000)
        </a>
        <a
          href="#prompts"
          className="hover:text-zinc-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Два 8K-промта
        </a>
        <a
          href="#history"
          className="hover:text-zinc-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Журнал кадров
        </a>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onTriggerUpload}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Загрузить фото</span>
        </button>
      </div>
    </header>
  );
};
