import React from 'react';

const CategoryBar = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
      <div className="flex overflow-x-auto py-4 px-4 space-x-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all hover:scale-110 border ${
              activeCategory === category
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black scale-105 border-2 border-amber-300 shadow-xl'
                : 'bg-gray-100/80 border border-gray-300 text-gray-800 hover:shadow-2xl'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryBar;
