"use client";

import { useCafeLighting } from "@/hooks/useCafeLighting";
import { useEffect, type ReactNode } from "react";

type CafeShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function CafeShell({ children, wide = false }: CafeShellProps) {
  const isDarkMode = useCafeLighting();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-zinc-950 dark:via-red-950 dark:to-zinc-950 relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200/30 dark:bg-red-800/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-300/20 dark:bg-red-700/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>
      <div className={`relative z-10 ${wide ? "max-w-6xl mx-auto px-4" : "max-w-md mx-auto"}`}>
        {children}
      </div>
    </div>
  );
}
