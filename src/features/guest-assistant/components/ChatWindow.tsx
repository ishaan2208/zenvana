'use client'

import type { FC } from 'react'
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import Bubble from "./Bubble";
import QuickReplies from "./QuickReplies";
import type { QuickReply } from "./QuickReplies";

interface Message {
  id: string;
  sender: "bot" | "guest";
  text: string;
  sla?: string;
}

interface ChatWindowProps {
  messages: Message[];
  quickReplies: QuickReply[];
  isTyping: boolean;
}

const ChatWindow: FC<ChatWindowProps> = ({
  messages,
  quickReplies,
  isTyping,
}) => {
  const endRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (messages.length === 0) return;
    // Scroll so the latest message (and typing indicator if any) is in view
    const id = requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "end",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [messages, quickReplies, isTyping, prefersReducedMotion]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 pt-6 pb-20">
        {messages.map((msg) => (
          <Bubble key={msg.id} sender={msg.sender} text={msg.text} sla={msg.sla} />
        ))}
        {isTyping && <Bubble sender="typing" text="" />}
        {quickReplies.length > 0 && !isTyping && (
          <QuickReplies replies={quickReplies} />
        )}

        {/* Scroll anchor to ensure we always scroll to the bottom */}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
