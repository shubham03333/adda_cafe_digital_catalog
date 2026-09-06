"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Dish } from "@/data/menuData";
import { cn } from "@/lib/utils";

const WaiterSheet = dynamic(() => import("@/components/waiter/WaiterSheet").then((mod) => mod.WaiterSheet), {
  ssr: false,
});

type WaiterLauncherProps = {
  dishes: Dish[];
  tableNumber?: number | null;
  lift?: boolean;
  onViewDish?: (dish: Dish) => void;
};

export default function WaiterLauncher({ dishes, tableNumber, lift = false, onViewDish }: WaiterLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-40 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-red-700 text-white shadow-xl",
          lift ? "bottom-24 right-3" : "bottom-6 right-3"
        )}
        aria-label="Ask AI Waiter"
        title="Ask AI Waiter"
      >
        <span className="text-base leading-none">🎙</span>
        <span className="text-[8px] font-black leading-none">AI</span>
      </button>
      {open ? (
        <WaiterSheet
          open={open}
          dishes={dishes}
          tableNumber={tableNumber}
          onClose={() => setOpen(false)}
          onViewDish={onViewDish}
        />
      ) : null}
    </>
  );
}
