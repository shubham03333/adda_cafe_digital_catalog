"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Send, X } from "lucide-react";
import { SheetPortal } from "@/components/order/SheetPortal";
import { MenuPhoto } from "@/components/order/MenuPhoto";
import { VegMark } from "@/components/order/VegMark";
import { askWaiter, trackWaiterView } from "@/actions/waiter";
import type { Dish } from "@/data/menuData";
import { isVegDish, prepMinutes } from "@/lib/order-display";
import { GUEST_STORAGE_KEY, type GuestProfile } from "@/lib/guest-profile";
import {
  createSpeechRecognizer,
  speakWaiterReply,
  speechRecognitionSupported,
  stopWaiterSpeech,
} from "@/lib/ai/speech";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What's popular?",
  "Suggest something spicy",
  "Recommend for kids",
  "Suggest under ₹300",
  "Coffee recommendations",
  "Best combo",
  "Today's special",
  "Preparation time",
];

type ChatTurn = {
  role: "customer" | "waiter";
  text: string;
  recIds?: string[];
  upsellId?: string | null;
};

type WaiterSheetProps = {
  open: boolean;
  dishes: Dish[];
  tableNumber?: number | null;
  onClose: () => void;
  onViewDish?: (dish: Dish) => void;
};

function sessionId() {
  const key = "adda-review-session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

function matchDish(dishes: Dish[], id?: string | null, name?: string | null) {
  if (!id && !name) return null;
  const byId = dishes.find(
    (dish) => String(dish.id) === String(id) || String(dish.posMenuItemId || "") === String(id)
  );
  if (byId) return byId;
  const wanted = String(name || "").trim().toLowerCase();
  if (!wanted) return null;
  return dishes.find((dish) => dish.name.toLowerCase() === wanted) ?? null;
}

export function WaiterSheet({ open, dishes, tableNumber, onClose, onViewDish }: WaiterSheetProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const voiceSupported = useMemo(() => speechRecognitionSupported(), []);

  useEffect(() => {
    if (!open) stopWaiterSpeech();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  function send(text: string, voice = false) {
    const question = text.trim();
    if (!question || pending) return;
    setDraft("");
    setError(null);
    stopWaiterSpeech();
    const history = turns.slice(-10).map((turn) => ({ role: turn.role, text: turn.text }));
    setTurns((prev) => [...prev, { role: "customer", text: question }]);
    startTransition(async () => {
      let guest: GuestProfile | null = null;
      try {
        const raw = sessionStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) guest = JSON.parse(raw) as GuestProfile;
      } catch {
        guest = null;
      }
      const result = await askWaiter({
        sessionId: sessionId(),
        tableNumber: tableNumber ?? undefined,
        question,
        voice,
        guestName: guest?.name,
        guestPhone: guest?.phone,
        history,
      });
      if (!result.ok) {
        setError(result.error);
        speakWaiterReply(result.error, "en");
        setTurns((prev) => [...prev, { role: "waiter", text: result.error }]);
        return;
      }
      speakWaiterReply(result.reply, result.language);
      setTurns((prev) => [
        ...prev,
        {
          role: "waiter",
          text: result.reply,
          recIds: result.recommendations.map((item) => item.id || item.name),
          upsellId: result.upsell?.id || result.upsell?.name || null,
        },
      ]);
    });
  }

  function listen() {
    const recognition = createSpeechRecognizer();
    if (!recognition) return;
    setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) send(transcript, true);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  return (
    <SheetPortal>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="fixed inset-0 z-[80] mx-auto max-w-md bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[90] mx-auto flex h-[70dvh] max-w-md flex-col rounded-t-[28px] bg-white shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-base font-black text-gray-900">AI Waiter</p>
                  <p className="text-[11px] font-medium text-gray-500">Ask about our menu, spice, combos, or budget</p>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50"
                  onClick={onClose}
                  aria-label="Close AI Waiter"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3">
                {turns.length === 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => send(item)}
                        className="rounded-full bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-800"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
                {turns.map((turn, index) => (
                  <div key={`${turn.role}-${index}`} className={cn("flex", turn.role === "customer" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-3 py-2 text-sm",
                        turn.role === "customer" ? "bg-red-700 text-white" : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{turn.text}</p>
                      {turn.role === "waiter" ? (
                        <div className="mt-2 space-y-2">
                          {(turn.recIds ?? [])
                            .map((id) => matchDish(dishes, id, id))
                            .filter((dish): dish is Dish => Boolean(dish))
                            .map((dish) => (
                              <WaiterDishCard
                                key={String(dish.id)}
                                dish={dish}
                                onView={() => {
                                  void trackWaiterView(dish.name);
                                  onViewDish?.(dish);
                                  onClose();
                                }}
                              />
                            ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                {pending ? <p className="text-xs font-medium text-gray-400">AI Waiter is thinking…</p> : null}
                {error && !pending ? <p className="text-xs text-red-600">{error}</p> : null}
              </div>

              <form
                className="flex items-end gap-2 border-t border-gray-100 px-3 py-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  send(draft);
                }}
              >
                {voiceSupported ? (
                  <button
                    type="button"
                    onClick={listen}
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      listening ? "bg-red-700 text-white" : "bg-gray-50 text-gray-900"
                    )}
                    aria-label="Speak"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                ) : null}
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask about food, drinks, spice…"
                  className="h-11 min-w-0 flex-1 rounded-2xl bg-gray-50 px-3 text-sm text-gray-900 outline-none"
                />
                <button
                  type="submit"
                  disabled={pending || !draft.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-700 text-white disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </SheetPortal>
  );
}

function WaiterDishCard({ dish, onView }: { dish: Dish; onView: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white text-gray-900 shadow-sm">
      <div className="flex gap-2 p-2">
        <MenuPhoto src={dish.image} className="h-16 w-16 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wide text-red-700">AI Recommended</p>
          <div className="mt-0.5 flex items-start gap-1">
            <VegMark veg={isVegDish(dish)} className="mt-0.5" />
            <p className="line-clamp-2 text-xs font-bold">{dish.name}</p>
          </div>
          <p className="mt-0.5 text-xs font-black">₹{dish.price} · {prepMinutes(dish)} min</p>
        </div>
      </div>
      <button type="button" onClick={onView} className="w-full border-t border-gray-100 py-2 text-xs font-black text-red-700">
        View dish
      </button>
    </div>
  );
}
