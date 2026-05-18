import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { subscribeToCategories } from '../services/adminService';
import { Link } from 'react-router-dom';

export default function CategorySlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const unsub = subscribeToCategories(cats => setCategories(cats));
    return () => unsub();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full bg-[#0a0a0a] py-3 border-b border-[#161616] flex items-center group">
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 z-10 p-2 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <ChevronLeft size={24} className="hover:text-wine-500 drop-shadow-[0_0_5px_rgba(128,0,0,0.8)]" />
      </button>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-3 px-4 scrollbar-hide snap-x scroll-smooth w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button className="whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all bg-white text-black snap-start shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          All
        </button>
        {categories.map((cat) => (
          <Link 
            key={cat.id}
            to={`/category/${cat.id}`}
            className="whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all bg-[#161616] text-gray-300 hover:bg-[#2a2a2a] hover:text-white border border-transparent hover:border-wine-600/30 snap-start shrink-0"
          >
            {cat.name}
          </Link>
        ))}
        <Link 
          to="/categories"
          className="whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all bg-[#2a2a2a] text-white hover:bg-wine-600 snap-start shrink-0 ml-2"
        >
          See All
        </Link>
      </div>

      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 z-10 p-2 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={24} className="hover:text-wine-500 drop-shadow-[0_0_5px_rgba(128,0,0,0.8)]" />
      </button>
    </div>
  );
}
