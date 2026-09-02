"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    async function clearWorkers() {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    }

    if (process.env.NODE_ENV !== "production") {
      void clearWorkers();
      return;
    }

    void navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}
