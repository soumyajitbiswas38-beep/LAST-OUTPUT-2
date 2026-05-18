import React, { useState, useEffect, useRef } from 'react';
import { subscribeToAds, AdData } from '../services/adService';
import { X } from 'lucide-react';

export default function PopupAd({ onClose }: { onClose: () => void }) {
  const [ad, setAd] = useState<AdData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToAds((ads) => {
      const matchedAd = ads.find(a => a.type === 'popup_ad' && a.active);
      setAd(matchedAd || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (containerRef.current && ad?.adCode) {
      containerRef.current.innerHTML = '';
      
      let html = ad.adCode.trim();
      if (html.match(/^https?:\/\/[^\s<]+$/i)) {
        if (html.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i)) {
          html = `<img src="${html}" style="width:100%;max-height:60vh;object-fit:contain;"/>`;
        } else {
          html = `<a href="${html}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;width:100%;padding:4rem;color:white;text-decoration:underline;">Open Link</a>`;
        }
      }

      const fragment = document.createRange().createContextualFragment(html);
      containerRef.current.appendChild(fragment);
    } else if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  }, [ad?.adCode]);

  if (!ad || (!ad.adCode && !ad.imageUrl)) return null; // If no active ad or no image, don't show the wrapper or popup

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-600 rounded-full text-white transition-colors z-10"
        >
          <X size={20} />
        </button>
        <div className="p-4 border-b border-[#2a2a2a] bg-[#0a0a0a]">
           <span className="text-gray-400 font-medium text-sm tracking-widest">ADVERTISEMENT</span>
        </div>
        <div ref={containerRef} className="w-full flex items-center justify-center bg-black min-h-[200px]" onClick={onClose}>
          {/* Legacy fallback */}
          {!ad.adCode && ad.imageUrl && (
            <a href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full">
              <img src={ad.imageUrl} alt="Advertisement" className="w-full h-auto max-h-[60vh] object-contain bg-black" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
