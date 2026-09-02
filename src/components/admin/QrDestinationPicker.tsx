"use client";

import { useState } from "react";
import { QrGrid, type QrDestination } from "@/components/admin/QrGrid";
import { isOrderingEnabled } from "@/lib/pos/flags-client";

type Props = { tableCount: number };

export function QrDestinationPicker({ tableCount }: Props) {
  const [destination, setDestination] = useState<QrDestination>("review");
  const ordering = isOrderingEnabled();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["review", "Review"],
            ["menu", "Menu only"],
            ...(ordering ? ([["order", "Order"]] as const) : []),
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setDestination(id)}
            className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
              destination === id ? "bg-red-700 text-white" : "bg-red-50 text-red-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <QrGrid tableCount={tableCount} destination={destination} />
    </div>
  );
}
