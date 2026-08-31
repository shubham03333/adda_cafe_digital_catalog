import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-500 focus:border-red-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-100",
        className
      )}
      {...props}
    />
  );
}
