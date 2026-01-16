import React, { useRef, useEffect } from 'react';

const MobileDishCard3D = ({ dish }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateY = (centerX - e.clientX) / 15;
      const rotateX = (centerY - e.clientY) / 15;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="group relative">
      {/* Card glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-red-500 to-red-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

      {/* Main card */}
      <div
        ref={cardRef}
        className="relative bg-gradient-to-br from-red-600 to-red-800 rounded-3xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-100 ease-out hover:translate-z-15 hover:scale-102 p-5"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-900/50 to-transparent rounded-tr-full"></div>

        {/* Image container */}
        <div className="relative h-32 overflow-hidden rounded-2xl mb-4">
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover opacity-100 group-hover:scale-110 transition-all duration-500"
          />

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Popular badge */}
          {dish.popular && (
            <div className="absolute top-3 right-3 bg-white shadow-lg p-2 rounded-full">
              <svg className="w-4 h-4 fill-red-500 text-red-500" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-white group-hover:text-red-100 transition-colors duration-300">
              {dish.name}
            </h3>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 border-2 border-white/30 group-hover:scale-110 transition-transform duration-300">
              <span className="text-xl font-black text-white">₹{dish.price}</span>
            </div>
          </div>

          <p className="text-xs text-red-100 opacity-80 mb-3 line-clamp-2">{dish.description}</p>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-white/80 bg-white/20 px-3 py-1 rounded-full">
              {dish.category}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-red-200">★</span>
                <span className="text-white text-xs font-medium">{dish.rating}</span>
              </div>
              <svg className="w-4 h-4 text-red-200 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDishCard3D;
