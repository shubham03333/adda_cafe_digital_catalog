"use client";

import { cn } from "@/lib/utils";

type ChipGroupProps = {
  label: string;
  options: readonly string[];
  value: string | string[] | null;
  multiple?: boolean;
  compact?: boolean;
  onChange: (value: string | string[]) => void;
};

export function ChipGroup({ label, options, value, multiple, compact, onChange }: ChipGroupProps) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const toggle = (option: string) => {
    if (multiple) {
      const next = selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option];
      onChange(next);
      return;
    }
    onChange(option);
  };

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                compact ? "rounded-2xl border px-3 py-2 text-xs font-medium text-left leading-snug transition-all" : "rounded-2xl border px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black border-amber-300 shadow-lg scale-105"
                  : "bg-gray-100/80 border-gray-300 text-gray-800 dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-600"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
