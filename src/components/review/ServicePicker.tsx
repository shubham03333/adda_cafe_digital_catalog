"use client";

import { Heart, Zap, Star, Minus } from "lucide-react";
import { SERVICE_OPTIONS } from "@/lib/branding";
import { cn } from "@/lib/utils";

const ICONS = {
  Friendly: Heart,
  Quick: Zap,
  Excellent: Star,
  Average: Minus,
} as const;

type ServicePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ServicePicker({ value, onChange }: ServicePickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">How was the service?</legend>
      <div className="grid grid-cols-2 gap-2">
        {SERVICE_OPTIONS.map((option) => {
          const Icon = ICONS[option];
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "min-h-14 rounded-2xl border flex flex-col items-center justify-center gap-1 text-sm font-semibold",
                active
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black border-amber-300 shadow-md"
                  : "bg-gray-50 border-gray-200 text-gray-800 dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-600"
              )}
            >
              <Icon className="h-4 w-4" />
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
