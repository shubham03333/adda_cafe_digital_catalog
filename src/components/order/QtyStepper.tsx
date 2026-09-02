"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QtyStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label: string;
};

export function QtyStepper({ value, onChange, min = 0, max = 20, size = "md", label }: QtyStepperProps) {
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className="inline-flex items-center rounded-full bg-[#F5B400] text-gray-900 shadow-sm">
      <button
        type="button"
        className={cn("flex items-center justify-center", box)}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-black tabular-nums">{value}</span>
      <button
        type="button"
        className={cn("flex items-center justify-center", box)}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
