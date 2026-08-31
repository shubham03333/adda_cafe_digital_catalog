"use client";

import { cn } from "@/lib/utils";

type CategoryBarProps = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
};

const CategoryBar = ({ categories, activeCategory, onCategoryChange }: CategoryBarProps) => {
  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-zinc-950/90 border-b border-red-100 dark:border-zinc-800">
      <div className="flex overflow-x-auto hide-scrollbar py-3 px-4 gap-2 snap-x">
        {categories.map((category) => {
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={cn(
                "snap-start min-h-12 px-4 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border",
                active
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black border-amber-300 shadow-md scale-[1.02]"
                  : "bg-gray-100/90 border-gray-200 text-gray-800 dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-600"
              )}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
