import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-5 shadow-lg dark:bg-zinc-900/80 dark:border dark:border-red-900/40",
        className
      )}
      {...props}
    />
  );
}
