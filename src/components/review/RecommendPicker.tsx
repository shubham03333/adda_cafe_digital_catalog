"use client";

import { RECOMMEND_OPTIONS } from "@/lib/branding";
import { cn } from "@/lib/utils";

type RecommendPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RecommendPicker({ value, onChange }: RecommendPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">Would you recommend us?</legend>
      <div className="grid grid-cols-3 gap-2">
        {RECOMMEND_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-16 rounded-2xl border flex flex-col items-center justify-center gap-1 px-1",
                active
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black border-amber-300 shadow-md"
                  : "bg-gray-50 border-gray-200 text-gray-800 dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-600"
              )}
            >
              <span className="text-xl" aria-hidden>
                {option.emoji}
              </span>
              <span className="text-xs font-semibold leading-tight text-center">{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
