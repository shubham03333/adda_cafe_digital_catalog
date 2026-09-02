"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function SheetPortal({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setNode(document.body);
  }, []);
  if (!node) return null;
  return createPortal(children, node);
}
