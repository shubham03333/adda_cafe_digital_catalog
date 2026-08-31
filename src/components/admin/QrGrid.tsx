"use client";

import { useEffect, useState } from "react";
import { SITE_URL } from "@/lib/utils";

type QrGridProps = {
  tableCount: number;
};

export function QrGrid({ tableCount }: QrGridProps) {
  const [images, setImages] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const QRCode = (await import("qrcode")).default;
      const next: Record<number, string> = {};
      for (let table = 1; table <= tableCount; table += 1) {
        const url = `${SITE_URL}/t/${table}`;
        next[table] = await QRCode.toDataURL(url, {
          margin: 1,
          width: 280,
          color: { dark: "#991b1b", light: "#ffffff" },
        });
      }
      if (!cancelled) setImages(next);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [tableCount]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: tableCount }, (_, i) => i + 1).map((table) => (
        <div key={table} className="rounded-3xl bg-white p-4 shadow-lg text-center dark:bg-zinc-900">
          {images[table] ? (
            <img src={images[table]} alt={`Table ${table} QR`} className="mx-auto w-full" />
          ) : (
            <div className="aspect-square animate-pulse rounded-2xl bg-red-100" />
          )}
          <p className="mt-2 font-black text-gray-800 dark:text-white">Table {table}</p>
          <p className="text-xs text-gray-500 break-all">{`${SITE_URL}/t/${table}`}</p>
        </div>
      ))}
    </div>
  );
}
