"use client";

import { LANGUAGE_OPTIONS, type LanguageCode } from "@/lib/branding";
import { cn } from "@/lib/utils";

type LanguagePickerProps = {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
};

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">Preferred language</legend>
      <div className="grid grid-cols-3 gap-2">
        {LANGUAGE_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-14 rounded-2xl border text-sm font-semibold",
                active
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black border-amber-300 shadow-md"
                  : "bg-gray-50 border-gray-200 text-gray-800 dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-600"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
