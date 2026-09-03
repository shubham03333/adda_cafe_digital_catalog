"use client";

import Link from "next/link";
import { Search, ShoppingBag, Star, X } from "lucide-react";
import { CAFE_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type OrderHeaderProps = {
  tableNumber: number;
  guestName?: string;
  itemCount: number;
  searchOpen: boolean;
  query: string;
  onSearchOpen: (open: boolean) => void;
  onQuery: (value: string) => void;
  onOpenCart: () => void;
};

export function OrderHeader({
  tableNumber,
  guestName,
  itemCount,
  searchOpen,
  query,
  onSearchOpen,
  onQuery,
  onOpenCart,
}: OrderHeaderProps) {
  return (
    <header className="shrink-0 bg-white/95 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-3 py-3">
        <img src="/adda.png" alt="" className="h-11 w-11 rounded-2xl object-cover shadow-sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black tracking-tight text-gray-900">{CAFE_NAME}</h1>
          <p className="text-xs font-medium text-gray-500">
            Table {tableNumber || "—"}
            {guestName ? ` · Hi, ${guestName}` : ""}
          </p>
        </div>
        <Link
          href={`/t/${tableNumber}/review`}
          className="flex h-11 items-center gap-1 rounded-2xl bg-gray-50 px-3 text-sm font-bold text-gray-900"
        >
          <Star className="h-4 w-4 fill-[#F5B400] text-[#F5B400]" />
          Review
        </Link>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-gray-900"
          aria-label="Search menu"
          onClick={() => onSearchOpen(!searchOpen)}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-gray-900"
          aria-label="Open cart"
          onClick={onOpenCart}
        >
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 ? (
            <span
              key={itemCount}
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-[pop_220ms_ease] items-center justify-center rounded-full bg-[#F5B400] px-1 text-[10px] font-black text-gray-900"
            >
              {itemCount}
            </span>
          ) : null}
        </button>
      </div>
      {searchOpen ? (
        <div className="px-3 pb-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search dishes, coffee, combos..."
            className="h-12 w-full rounded-2xl border border-gray-100 bg-[#FAFAFA] px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F5B400] focus:outline-none"
          />
        </div>
      ) : null}
    </header>
  );
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto px-3 pb-2 hide-scrollbar">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition",
              active ? "bg-[#F5B400] text-gray-900 shadow-sm" : "bg-white text-gray-700 shadow-sm"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
