'use client'

import { cn } from '@/lib/utils'
import ChatAvatar from "./Avatar";
import TypingIndicator from "./TypingIndicator";
import { motion, useReducedMotion } from "framer-motion";

export default function Bubble({
  sender,
  text,
  sla,
}: {
  sender: "bot" | "guest" | "typing";
  text: string;
  sla?: string;
}) {
  const isGuest = sender === "guest";
  const prefersReducedMotion = useReducedMotion();

  // 👉 Handle typing as a dedicated branch (no tail, no text)
  if (sender === "typing") {
    return (
      <div className="flex w-full gap-2 items-center justify-start">
        <ChatAvatar sender="bot" />
        <div className="max-w-[75%] rounded-2xl bg-white px-3 py-2 text-sm text-foreground shadow-md dark:bg-slate-800">
          <TypingIndicator />
        </div>
      </div>
    );
  }
  // Guest bubbles appear instantly for clear feedback; bot bubbles animate in
  const motionProps = prefersReducedMotion || isGuest
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <motion.div {...motionProps}>
      <div
        className={cn(
          "flex w-full gap-2 items-center",
          isGuest ? "justify-end" : "justify-start"
        )}
      >
        {sender === "bot" && <ChatAvatar sender="bot" />}

        {/* {sender === "bot" && <ChatAvatar sender="typing" />} */}

        <span
          className={cn(
            "relative max-w-[75%] rounded-2xl p-3 text-sm leading-relaxed shadow-md whitespace-pre-line",
            isGuest
              ? "bg-gradient-to-tr from-fuchsia-700/60 via-violet-700 to-violet-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              : "bg-white dark:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
            // tails
            "after:absolute after:bottom-[-6px] after:w-4 after:h-5  after:content-['']",
            isGuest
              ? "after:right-[0px] after:clip-path-[polygon(100%_0,0_0,0_100%)] after:rounded-bl-[10px]  after:bg-violet-700 "
              :             "after:left-[0px] dark:after:bg-slate-800 after:bg-white  after:clip-path-[polygon(100%_0,100%_0,100%_100%)] after:rounded-br-[10px]"
          )}
        >
          <span className="block">{text}</span>
          {sla && sender === "bot" && (
            <span className="mt-1.5 block text-xs opacity-80">
              ⏱ {sla}
            </span>
          )}
        </span>
        {sender === "guest" && <ChatAvatar sender="guest" />}
      </div>
    </motion.div>
  );
}
