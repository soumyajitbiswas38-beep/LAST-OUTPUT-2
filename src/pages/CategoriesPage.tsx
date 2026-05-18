import React, { useEffect, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { subscribeToCategories } from '../services/adminService';
import { Link } from 'react-router-dom';
import AdBanner from '../components/AdBanner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCategories((data) => {
      setCategories(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-6 max-w-[1800px] mx-auto w-full">
      <AdBanner type="top_banner" className="h-24 mb-6" />
      <div className="flex items-center gap-3 mb-8">
        <LayoutGrid className="text-wine-500" />
        <h1 className="text-2xl font-bold text-white">All Categories</h1>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 flex flex-col items-center hover:border-wine-500 transition-colors cursor-pointer group justify-center text-center">
              <h3 className="text-lg font-bold text-white group-hover:text-wine-400 transition-colors line-clamp-2">{cat.name}</h3>
            </Link>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No categories available.
            </div>
          )}
        </div>
      )}
      <AdBanner type="bottom_banner" className="h-24 mt-12" />
    </div>
  );
}
