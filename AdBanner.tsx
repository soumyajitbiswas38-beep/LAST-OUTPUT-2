import React, { useState, useEffect } from 'react';
import { subscribeToAds, AdData } from '../services/adService';

export default function AdBanner({ className = "h-24 sm:h-32", type = "top_banner" }: { className?: string, type?: string }) {
  const [ad, setAd] = useState<AdData | null>(null);

  useEffect(() => {
    const unsub = subscribeToAds((ads) => {
      const matchedAd = ads.find(a => a.type === type && a.active);
      setAd(matchedAd || null);
    });
    return () => unsub();
  }, [type]);

  if (!ad || !ad.imageUrl) return null; // Don't show anything if no active ad or no image url

  return (
    <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className={`block w-full bg-[#161616] border border-[#2a2a2a] rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer ${className}`}>
      <img src={ad.imageUrl} alt="Advertisement" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
      <div className="absolute top-2 right-2 bg-black/50 text-[10px] text-gray-400 px-1.5 py-0.5 rounded shadow">Ad</div>
    </a>
  );
}
