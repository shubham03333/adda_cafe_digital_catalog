import { cn } from "@/lib/utils";

export function VegMark({ veg, className }: { veg: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-[3px] border",
        veg ? "border-emerald-600" : "border-red-600",
        className
      )}
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={cn("h-2 w-2 rounded-full", veg ? "bg-emerald-600" : "bg-red-600")} />
    </span>
  );
}
