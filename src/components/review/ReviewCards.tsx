"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReviewSuggestion } from "@/types";

type ReviewCardsProps = {
  reviews: ReviewSuggestion[];
  onSelect: (index: number, text: string) => Promise<void>;
  copiedMessage: string | null;
};

export function ReviewCards({ reviews, onSelect, copiedMessage }: ReviewCardsProps) {
  const [busy, setBusy] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {copiedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            {copiedMessage}
          </motion.div>
        )}
      </AnimatePresence>
      {reviews.map((review, index) => (
        <motion.button
          key={review.id}
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          disabled={busy !== null}
          onClick={async () => {
            setBusy(index);
            await onSelect(index, review.text);
            setBusy(null);
          }}
          className="w-full text-left rounded-3xl bg-white p-5 shadow-lg dark:bg-zinc-900/80 dark:border dark:border-red-900/40 space-y-3 transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-70"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Suggestion {index + 1}</span>
            </span>
            <span className="text-xs font-semibold text-amber-600">
              {busy === index ? "Opening Google..." : "Tap to copy & open Google"}
            </span>
          </div>
          <p className="text-base leading-relaxed text-gray-800 dark:text-gray-100">{review.text}</p>
        </motion.button>
      ))}
    </div>
  );
}

export function useCopiedFlag(ms = 6000) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), ms);
    return () => clearTimeout(timer);
  }, [message, ms]);
  return { message, setMessage };
}
