import React from 'react';

const MobileDishCardFallback = ({ dish }) => {
  return (
    <div className="group relative mb-8">
      {/* Outer glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"></div>

      {/* Main card */}
      <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl overflow-hidden p-6">
      <div className="relative h-48 bg-gray-200 dark:bg-slate-700">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {dish.popular && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium z-30">
            Popular
          </div>
        )}
        {/* Floating price tag* */}
        <div className="absolute bottom-2 right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-black px-4 py-2 rounded-2xl border-4 border-white/20 font-black text-2xl shadow-xl group-hover:scale-110 transition-transform duration-300 z-10">
          ₹{dish.price}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-2xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-orange-300 transition-all duration-300">
            {dish.name}
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">{dish.description}</p>
        <span className="inline-block bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
          {dish.category}
        </span>
      </div>
      </div>
    </div>
  );
};

export default MobileDishCardFallback;
