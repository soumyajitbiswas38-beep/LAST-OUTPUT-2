import React, { useState, useEffect, useRef } from 'react';
import { subscribeToAds, AdData } from '../services/adService';

export default function AdBanner({ className = "h-24 sm:h-32", type = "top_banner" }: { className?: string, type?: string }) {
  const [ad, setAd] = useState<AdData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToAds((ads) => {
      const matchedAd = ads.find(a => a.type === type && a.active);
      setAd(matchedAd || null);
    });
    return () => unsub();
  }, [type]);

  useEffect(() => {
    if (containerRef.current && ad?.adCode) {
      containerRef.current.innerHTML = '';
      
      let html = ad.adCode.trim();
      if (html.match(/^https?:\/\/[^\s<]+$/i)) {
        if (html.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i)) {
          html = `<img src="${html}" style="width:100%;height:100%;object-fit:cover;border-radius:0.75rem;"/>`;
        } else {
          html = `<a href="${html}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:white;text-decoration:underline;">Open Link</a>`;
        }
      }

      const fragment = document.createRange().createContextualFragment(html);
      containerRef.current.appendChild(fragment);
    } else if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  }, [ad?.adCode]);

  if (!ad || (!ad.adCode && !ad.imageUrl)) return null;

  return (
    <div className={`relative w-full bg-[#161616] border border-[#2a2a2a] rounded-xl flex items-center justify-center overflow-hidden z-10 ${className}`}>
      <div ref={containerRef} className="w-full h-full AdWrapper flex items-center justify-center overflow-hidden">
        {/* Legacy fallback if they haven't updated */}
        {!ad.adCode && ad.imageUrl && (
          <a href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
            <img src={ad.imageUrl} alt="Advertisement" className="w-full h-full object-cover" />
          </a>
        )}
      </div>
      <div className="absolute top-2 right-2 bg-black/50 text-[10px] text-gray-400 px-1.5 py-0.5 rounded shadow pointer-events-none z-20">Ad</div>
    </div>
  );
}
