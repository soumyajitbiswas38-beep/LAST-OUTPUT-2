import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToActors, ActorData } from '../services/actorService';
import { subscribeToVideos, VideoData } from '../services/videoService';
import SEO from '../components/SEO';

export default function ActorsPage() {
  const [actors, setActors] = useState<ActorData[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLetter, setFilterLetter] = useState<string>('All');

  useEffect(() => {
    setLoading(true);
    const unsubActors = subscribeToActors(setActors);
    const unsubVideos = subscribeToVideos(setVideos);
    setLoading(false);
    return () => {
      unsubActors();
      unsubVideos();
    };
  }, []);

  const alphabet = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  const filteredActors = useMemo(() => {
    return actors.filter(actor => {
      if (filterLetter === 'All') return true;
      const firstChar = actor.name.charAt(0).toUpperCase();
      if (filterLetter === '#') {
        return !/[A-Z]/.test(firstChar);
      }
      return firstChar === filterLetter;
    });
  }, [actors, filterLetter]);

  const getActorVideoCount = (actorId: string) => {
    return videos.filter(v => v.actorIds?.includes(actorId)).length;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <SEO title="Pornstars Directory" description="A-Z Directory of Pornstars" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Pornstars Directory</h1>
        <p className="text-gray-400">Find your favorite models and actors A-Z.</p>
      </div>

      {/* A-Z Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 bg-[#111] p-4 rounded-xl border border-[#2a2a2a] justify-center sm:justify-start">
        {alphabet.map(letter => (
          <button
            key={letter}
            onClick={() => setFilterLetter(letter)}
            className={`w-8 h-8 flex items-center justify-center rounded-md font-medium text-sm transition-colors ${
              filterLetter === letter ? 'bg-wine-600 text-white' : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-white'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {filteredActors.map(actor => (
            <Link key={actor.id} to={`/actor/${actor.id}`} className="group flex flex-col gap-3 relative">
              <div className="w-full aspect-[2/3] rounded-xl overflow-hidden relative border border-[#2a2a2a] group-hover:border-wine-500 transition-colors">
                <img 
                  src={actor.profile_photo || 'https://via.placeholder.com/300x450?text=No+Photo'} 
                  alt={actor.name} 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Photo'; }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 px-2 py-3 bg-gradient-to-t from-black/80 to-transparent flex justify-end">
                  <span className="bg-black/60 backdrop-blur-sm text-xs text-white px-2 py-1 rounded-md flex items-center gap-1 font-medium border border-white/10">
                    📹 {getActorVideoCount(actor.id!)}
                  </span>
                </div>
              </div>
              <h3 className="text-white font-medium text-center sm:text-left group-hover:text-wine-400 transition-colors">
                {actor.name}
              </h3>
            </Link>
          ))}
          {filteredActors.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-[#161616] rounded-xl border border-[#2a2a2a]">
              No actors found for '{filterLetter}'.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
