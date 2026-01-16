import React, { useState, useEffect } from 'react';
import CategoryBar from './components/CategoryBar';
import MobileDishCard3D from './components/MobileDishCard3D';
import MobileDishCardFallback from './components/MobileDishCardFallback';
import { useCafeLighting } from './hooks/useCafeLighting';
import { useDevicePerformance } from './hooks/useDevicePerformance';
import { menuData, categories } from './data/menuData';

const App = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const isDarkMode = useCafeLighting();
  const isLowEnd = useDevicePerformance();

  const filteredDishes = (activeCategory === 'All'
    ? menuData
    : menuData.filter(dish => dish.category === activeCategory))
    .filter(dish =>
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b-4 border-red-500 text-center py-5">
          <div className="flex items-center justify-center mb-2">
            <img src="/adda.png" alt="Adda Logo" className="w-12 h-12 rounded-full" />
          </div>
          {/* <h1 className="text-4xl font-black bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            Adda Menu
          </h1> */}
          <p className="text-sm text-gray-600 font-medium mt-1">Where Every Bite Tells a Story</p>
        </header>

        {/* Search bar */}
        <div className="px-4 py-4">
          <div className="bg-white rounded-3xl shadow-lg p-4">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none text-gray-800 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <main className="px-4 py-6 pb-12">
          <h2 className="text-3xl font-black text-gray-800 mb-6">Menu Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredDishes.map(dish => (
              isLowEnd ? (
                <MobileDishCardFallback key={dish.id} dish={dish} />
              ) : (
                <MobileDishCard3D key={dish.id} dish={dish} />
              )
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
