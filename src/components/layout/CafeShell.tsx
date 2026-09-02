"use client";

import { useEffect, type ReactNode } from "react";

type CafeShellProps = {
  children: ReactNode;
  wide?: boolean;
  forceLight?: boolean;
  tone?: "default" | "order";
};

export function CafeShell({ children, wide = false, tone = "default" }: CafeShellProps) {
  const order = tone === "order";

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, []);

  useEffect(() => {
    if (!order) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [order]);

  return (
    <div
      className={
        order
          ? "h-dvh overflow-hidden bg-[#FAFAFA]"
          : "relative min-h-screen overflow-x-hidden bg-gradient-to-br from-red-50 via-white to-red-50"
      }
    >
      {order ? null : (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-red-200/30 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-red-300/20 blur-3xl" />
        </div>
      )}
      <div
        className={`relative z-10 ${wide ? "mx-auto max-w-6xl px-4" : "mx-auto max-w-md"} ${order ? "flex h-dvh flex-col overflow-hidden" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
