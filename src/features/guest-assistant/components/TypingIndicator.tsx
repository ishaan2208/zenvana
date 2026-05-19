'use client'

import type { FC } from 'react'

type Side = "bot" | "guest";
type Size = "sm" | "md" | "lg";

interface TypingIndicatorProps {
  /** Which side to align the bubble */
  side?: Side;
  /** Dot & bubble sizing */
  size?: Size;
  /** Render inside a bubble background */
  bubble?: boolean;
}

const sizeMap: Record<Size, { dot: string; pad: string }> = {
  sm: { dot: "h-1.5 w-1.5", pad: "px-2 py-1" },
  md: { dot: "h-2 w-2", pad: "px-3 py-1.5" },
  lg: { dot: "h-2.5 w-2.5", pad: "px-3.5 py-2" },
};

const TypingIndicator: FC<TypingIndicatorProps> = ({
  side = "bot",
  size = "md",
  bubble = true,
}) => {
  const { dot, pad } = sizeMap[size];
  const align = side === "guest" ? "justify-end" : "justify-start";
  const bubbleClass =
    side === "guest"
      ? // guest: brand gradient bubble
        "bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white"
      : // bot: soft dark bubble
        "dark:bg-transparent ";

  return (
    <div className={`flex ${align} py-2`}>
      <div
        role="status"
        aria-live="polite"
        aria-label="Typing"
        className={[
          "inline-flex items-center gap-1 rounded-2xl dark:shadow",
          bubble ? `${bubbleClass} ${pad}` : "",
        ].join(" ")}
      >
        <span className={`rounded-full ${dot} typing-dot`} />
        <span className={`rounded-full ${dot} typing-dot`} />
        <span className={`rounded-full ${dot} typing-dot`} />
      </div>
    </div>
  );
};

export default TypingIndicator;
