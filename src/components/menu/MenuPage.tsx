"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Sparkles, X } from "lucide-react";
import CategoryBar from "@/components/menu/CategoryBar";
import MobileDishCard3D from "@/components/menu/MobileDishCard3D";
import MobileDishCardFallback from "@/components/menu/MobileDishCardFallback";
import { CafeHeader } from "@/components/layout/CafeHeader";
import { CafeShell } from "@/components/layout/CafeShell";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { menuData, categoriesFrom, type Dish } from "@/data/menuData";

const RECENT_KEY = "adda-recent-searches";

type MenuPageProps = {
  tableNumber?: number | null;
  dishes?: Dish[];
};

export function MenuPage({ tableNumber = null, dishes = menuData }: MenuPageProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const isLowEnd = useDevicePerformance();
  const reviewHref = tableNumber ? `/t/${tableNumber}` : "/review";

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
      setRecent(stored.slice(0, 5));
    } catch {
      setRecent([]);
    }
  }, []);

  function rememberSearch(value: string) {
    const next = value.trim();
    if (next.length < 2) return;
    const updated = [next, ...recent.filter((item) => item.toLowerCase() !== next.toLowerCase())].slice(0, 5);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  }

  const categoryTabs = useMemo(() => categoriesFrom(dishes), [dishes]);

  const filteredDishes = useMemo(() => {
    const byCategory =
      activeCategory === "All" ? dishes : dishes.filter((dish) => dish.category === activeCategory);
    const q = searchQuery.toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      (dish) => dish.name.toLowerCase().includes(q) || dish.description.toLowerCase().includes(q)
    );
  }, [activeCategory, searchQuery, dishes]);

  return (
    <CafeShell>
      <CafeHeader href="/menu" />
      {tableNumber ? (
        <p className="text-center text-xs font-medium text-gray-500 pt-2">Table {tableNumber}</p>
      ) : null}

      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search your favourite dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => rememberSearch(searchQuery)}
            onKeyDown={(e) => {
              if (e.key === "Enter") rememberSearch(searchQuery);
            }}
            className="w-full min-h-12 pl-12 pr-12 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-sm focus:border-red-500 focus:outline-none text-gray-800 placeholder-gray-400 dark:text-gray-100"
          />
          {searchQuery ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center text-gray-400"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
        {!searchQuery && recent.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {recent.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSearchQuery(item)}
                className="min-h-10 px-3 rounded-full bg-red-50 text-red-700 text-xs font-medium dark:bg-red-950 dark:text-red-100"
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <CategoryBar
        categories={categoryTabs}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <main className="px-4 pt-5 pb-28">
        {filteredDishes.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-8 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-800 dark:text-white">No dishes match that</p>
            <p className="text-sm text-gray-500 mt-2">Try another name, or browse a category above.</p>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-red-700"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
            >
              Show full menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredDishes.map((dish, index) => (
              <motion.div
                key={dish.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.28, delay: Math.min(index, 6) * 0.04 }}
              >
                {isLowEnd ? (
                  <MobileDishCardFallback dish={dish} />
                ) : (
                  <MobileDishCard3D dish={dish} query={searchQuery} />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="max-w-md mx-auto px-4 pb-4">
          <Link
            href={reviewHref}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 text-white font-semibold shadow-xl"
          >
            <Sparkles className="w-4 h-4" />
            How was your experience?
          </Link>
        </div>
      </div>
    </CafeShell>
  );
}
