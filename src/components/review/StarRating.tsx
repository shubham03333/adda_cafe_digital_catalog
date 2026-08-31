"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange: (value: number) => void;
};

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex justify-center gap-2" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = star <= value;
        return (
          <motion.button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => onChange(star)}
            className="min-h-12 min-w-12 p-1 flex items-center justify-center"
          >
            <Star
              className={cn(
                "h-12 w-12 transition-colors",
                selected ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-zinc-600"
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
