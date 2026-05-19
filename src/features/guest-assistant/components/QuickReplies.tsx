'use client'

import type { FC, ReactNode } from 'react'

export type QuickReply = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
};

interface QuickRepliesProps {
  replies: QuickReply[];
}

const QuickReplies: FC<QuickRepliesProps> = ({ replies }) => (
  <div className="flex flex-wrap justify-center gap-2 pt-3 pb-2">
    {replies.map(({ label, onClick, icon }, idx) => (
      <button
        type="button"
        key={`${label}-${idx}`}
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out motion-safe:hover:scale-[1.015] hover:border-white/60 hover:bg-white/90 hover:shadow motion-safe:active:scale-[0.985] motion-reduce:transition-none dark:border-white/20 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800/90 touch-manipulation"
      >
        {icon && <span className="shrink-0 text-current [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
        <span className="text-left">{label}</span>
      </button>
    ))}
  </div>
);

export default QuickReplies;
