'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/Card'
import ChatWindow from './ChatWindow'
import { useGuestServiceMenu } from '@/features/guest-assistant/constants/guestService'
import type { GuestServiceItem } from '@/features/guest-assistant/constants/guestService'
import type { QuickReply } from './QuickReplies'
import { ITEM_ICON, CATEGORY_ICON, UI_ICON } from '@/features/guest-assistant/constants/icons'
import { useGuestProfile } from '@/features/guest-assistant/stores/guestProfile'
import { useStayStore } from '@/features/guest-assistant/stores/stayStore'
import type { Booking } from '@/features/guest-assistant/types/booking.types'
import { ChatSwipeHandler } from './ChatSwipeHandler'

/** ----------------------------------------------------------------
 * 📨 Local message shape
 * ----------------------------------------------------------------*/
interface Message {
  id: string;
  sender: "bot" | "guest";
  text: string;
  /** Optional SLA/time shown under bot reply (e.g. "Within 15 min" or from backend) */
  sla?: string;
}

function formatDueAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `By ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  } catch {
    return "";
  }
}

const CHAT_STORAGE_KEY_PREFIX = "guest-chatbot-history";
const MAX_STORED_MESSAGES = 200;

function getStorageKey(bookingId: string | number | null | undefined): string {
  return `${CHAT_STORAGE_KEY_PREFIX}-${bookingId ?? "default"}`;
}

function makeMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadChatFromStorage(key: string): { messages: Message[]; categoryIndex: number | null } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { messages: [], categoryIndex: null };
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object" || !Array.isArray((data as { messages?: unknown }).messages))
      return { messages: [], categoryIndex: null };
    const { messages, categoryIndex } = data as { messages: Message[]; categoryIndex?: number | null };
    const list = Array.isArray(messages) ? messages : [];
    const valid = list.filter(
      (m) => m && typeof m.sender === "string" && typeof m.text === "string" && (m.sender === "bot" || m.sender === "guest")
    ).map((m) => ({
      id: typeof (m as Message).id === "string" ? (m as Message).id : makeMessageId(),
      sender: (m as Message).sender,
      text: (m as Message).text,
      sla: typeof (m as Message).sla === "string" ? (m as Message).sla : undefined,
    }));
    const idx = typeof categoryIndex === "number" && Number.isInteger(categoryIndex) ? categoryIndex : null;
    return { messages: valid, categoryIndex: idx };
  } catch {
    return { messages: [], categoryIndex: null };
  }
}

function saveChatToStorage(
  key: string,
  messages: Message[],
  categoryIndex: number | null
): void {
  try {
    const toSave = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(key, JSON.stringify({ messages: toSave, categoryIndex }));
  } catch {
    // ignore quota or parse errors
  }
}

/** ----------------------------------------------------------------
 * 🚀 GuestChatBot – root UI component
 * ----------------------------------------------------------------*/
export default function GuestChatBot() {
  const router = useRouter()
  const guestServiceMenu = useGuestServiceMenu();
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [categoryIndex, setCategoryIndex] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [restoreAttempted, setRestoreAttempted] = useState(false);
  const sentGreetingRef = useRef(false);
  const botTimeoutsRef = useRef<number[]>([]);

  const booking = useStayStore((s) => s.booking) as Booking | null
  const storageKey = getStorageKey(booking?.id ?? null);
  const { getContextualGreeting, getRecommendedServices, addServiceToHistory } =
    useGuestProfile();

  const recommendedServiceSet = useMemo(
    () => new Set(getRecommendedServices()),
    [getRecommendedServices]
  );

  const botSend = (text: string, delay = 500, sla?: string) => {
    setIsTyping(true);
    const timeoutId = window.setTimeout(() => {
      push({ sender: "bot", text, sla });
      setIsTyping(false);
    }, delay);
    botTimeoutsRef.current.push(timeoutId);
  };

  /** --------------------------------------------------------------
   * Utils
   * --------------------------------------------------------------*/
  const push = (msg: Omit<Message, "id">) =>
    setMessages((prev) => [...prev, { id: makeMessageId(), ...msg }]);

  const buildHomeReplies = (): QuickReply[] => {
    const featuredItems = getFeaturedItems().sort((a, b) => {
      if (a.type === "ORDER_FOOD") return -1;
      if (b.type === "ORDER_FOOD") return 1;
      return 0;
    });
    const featured = featuredItems.map((item) => ({
      label: item.isChargeable ? `${item.label} 💰` : item.label,
      onClick: () => handleItem(item),
      icon: ITEM_ICON[item.type],
    }));

    const extras: QuickReply[] = [
      {
        label: "Explore Services",
        icon: UI_ICON.browse,
        onClick: () => {
          setCategoryIndex(null);
          setQuickReplies(buildCategoriesReplies());
          push({ sender: "guest", text: "Browse categories" });
          botSend("Choose a category below 👇");
        },
      },
    ];

    return [...featured, ...extras] as QuickReply[];
  };

  const buildCategoriesReplies = (): QuickReply[] => {
    const categories = guestServiceMenu.map((cat, idx) => ({
      label: cat.category,
      icon: CATEGORY_ICON[cat.category],
      onClick: () => handleCategory(idx),
    }));

    const extras: QuickReply[] = [
      {
        label: "Home",
        icon: UI_ICON.home,
        onClick: () => {
          setCategoryIndex(null);
          setQuickReplies(buildHomeReplies());
          push({ sender: "guest", text: "Back to home" });
          botSend("Quick actions below, or pick a category.");
        },
      },
      {
        label: "Didn’t find what I need",
        icon: UI_ICON.help,
        onClick: () =>
          botSend(
            `No worries! Please call reception at ${booking?.property?.receptionNo ?? "100"
            }`
          ),
      },
    ];

    return [...categories, ...extras] as QuickReply[];
  };

  const buildItemReplies = (idx: number): QuickReply[] => {
    const replies = guestServiceMenu[idx].items
      .filter((item) => !item.featured)
      .map((item) => ({
        label: item.isChargeable ? `${item.label} 💰` : item.label,
        icon: ITEM_ICON[item.type],
        onClick: () => handleItem(item),
      }));

    const extras: QuickReply[] = [
      {
        label: "Go Back",
        icon: UI_ICON.back,
        onClick: () => {
          setCategoryIndex(null);
          setQuickReplies(buildCategoriesReplies());
          push({ sender: "guest", text: "Go back" });
          botSend("No problem. Please choose a category below 👇");
        },
      },
      {
        label: "Didn’t find what I need",
        icon: UI_ICON.help,
        onClick: () =>
          botSend(
            "Please call reception at 100 or press the Help button on your TV."
          ),
      },
    ];

    return [...replies, ...extras] as QuickReply[];
  };

  const getFeaturedItems = (): GuestServiceItem[] =>
    guestServiceMenu.flatMap((cat) =>
      cat.items.filter((i) => i.featured || recommendedServiceSet.has(i.type))
    );

  const handleCategory = (idx: number) => {
    setCategoryIndex(idx);
    setQuickReplies(buildItemReplies(idx));
    push({ sender: "guest", text: guestServiceMenu[idx].category });
    botSend(
      `Great! Please pick a service in "${guestServiceMenu[idx].category}"`
    );
  };

  const handleItem = async (item: GuestServiceItem) => {
    push({ sender: "guest", text: item.label });
    setIsTyping(true);

    // Yield so the user bubble paints and scroll runs before we block on the API
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    );

    try {
      const maybeReply = await item.action();
      const backendSla = maybeReply && typeof maybeReply === "object" && "slaMinutes" in maybeReply
        ? `Within ${(maybeReply as { slaMinutes: number }).slaMinutes} min`
        : maybeReply && typeof maybeReply === "object" && "dueAt" in maybeReply
          ? formatDueAt((maybeReply as { dueAt: string }).dueAt)
          : undefined;
      const sla = backendSla ?? (item.etaMinutes != null ? `Within ${item.etaMinutes} min` : undefined);

      if (typeof maybeReply === "string") {
        botSend(maybeReply, 500, sla);
      } else if (item.reply) {
        botSend(item.reply, 500, sla);
      } else {
        botSend("Thank you for your request! We'll process it shortly.", 500, sla);
      }
    } catch (error) {
      setIsTyping(false);
      push({
        sender: "bot",
        text:
          error instanceof Error && error.message
            ? error.message
            : "Session expired. Please sign in again.",
      });
      setQuickReplies([]);
      setTimeout(() => router.replace('/guest/login'), 900)
      return;
    }

    addServiceToHistory(item.type, true);

    if (item.kind === "CHARGEABLE") {
      setQuickReplies(buildHomeReplies());
    } else {
      setCategoryIndex(null);
      setQuickReplies(buildHomeReplies());
    }
  };

  // Restore chat history from localStorage when storage key or menu is ready
  const lastRestoredKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastRestoredKeyRef.current === storageKey || !guestServiceMenu?.length) return;
    const saved = loadChatFromStorage(storageKey);
    if (saved.messages.length > 0) {
      setMessages(saved.messages);
      setCategoryIndex(saved.categoryIndex);
      setQuickReplies(
        saved.categoryIndex === null
          ? buildHomeReplies()
          : buildItemReplies(saved.categoryIndex)
      );
    }
    lastRestoredKeyRef.current = storageKey;
    setRestoreAttempted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildHomeReplies/buildItemReplies are stable enough; full deps cause loops
  }, [storageKey, guestServiceMenu]);

  // Persist to localStorage when messages or category change
  useEffect(() => {
    saveChatToStorage(storageKey, messages, categoryIndex);
  }, [storageKey, messages, categoryIndex]);

  useEffect(() => {
    return () => {
      for (const timeoutId of botTimeoutsRef.current) {
        clearTimeout(timeoutId);
      }
      botTimeoutsRef.current = [];
    };
  }, []);

  // Initial greeting only after restore attempted and no messages (send once)
  useEffect(() => {
    if (!restoreAttempted || messages.length > 0 || sentGreetingRef.current) return;
    sentGreetingRef.current = true;
    botSend(
      `${getContextualGreeting()} I’m your Zenvana concierge. Quick actions below, or browse categories 👇`,
      0
    );
    setQuickReplies(buildHomeReplies());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow deps; full deps would re-send greeting
  }, [restoreAttempted]);

  const onRefresh = () => {
    setQuickReplies(buildHomeReplies());
    botSend("Refreshed. Here are your latest quick actions.");
  };

  const onBack = () => {
    if (categoryIndex !== null) {
      setCategoryIndex(null);
      setQuickReplies(buildCategoriesReplies());
      botSend("Back to categories.");
    }
  };

  return (
    <ChatSwipeHandler onBack={onBack} canGoBack={categoryIndex !== null} onRefresh={onRefresh}>
      <Card
        className="mx-auto mt-2 flex h-full w-full max-w-md flex-col border-0 bg-transparent min-h-0"
      >
        <CardContent className="flex min-h-0 flex-1 w-full flex-col px-1 sm:px-0.5 ">
          <ChatWindow
            messages={messages}
            quickReplies={quickReplies}
            isTyping={isTyping}
          />
        </CardContent>

        <AnimatePresence>
          {categoryIndex === null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="px-4 pb-3 text-center text-xs text-muted-foreground shrink-0"
            >
              <div className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Magical mode enabled: contextual recommendations active
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </ChatSwipeHandler>
  );
}
