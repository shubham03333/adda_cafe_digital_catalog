import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg hover:scale-[1.02]",
        accent:
          "bg-gradient-to-r from-amber-400 to-orange-500 text-black border-2 border-amber-300 shadow-xl",
        outline:
          "border-2 border-red-200 bg-white text-red-700 hover:bg-red-50 dark:bg-zinc-900 dark:border-red-800 dark:text-red-100",
        ghost: "text-red-700 hover:bg-red-50 dark:text-red-200",
      },
      size: {
        default: "min-h-12 h-12 px-5",
        lg: "min-h-14 h-14 px-6 text-base",
        sm: "min-h-11 h-11 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
