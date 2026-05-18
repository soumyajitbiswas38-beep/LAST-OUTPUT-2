import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchActorBySlug, ActorData } from '../services/actorService';
import { fetchAllVideos, VideoData } from '../services/videoService';
import VideoCard from '../components/VideoCard';
import AdBanner from '../components/AdBanner';
import SEO from '../components/SEO';
import { Helmet } from 'react-helmet-async';

export default function ActorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [actor, setActor] = useState<ActorData | null>(null);
  const [actorVids, setActorVids] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    let unsubVids: () => void;
    
    const loadActor = async () => {
      // Try fetching by ID first, then by slug if needed
      let data = await fetchActorBySlug(id);
      setActor(data);
      if (data) {
         const { subscribeToVideos } = await import('../services/videoService');
         unsubVids = subscribeToVideos((vids) => {
           setActorVids(vids.filter(v => v.actorIds?.includes(data!.id as string)));
           setLoading(false);
         }, 500);
      } else {
        setLoading(false);
      }
    };
    loadActor();

    return () => unsubVids?.();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-500"></div>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="flex justify-center p-12 text-gray-500">
         Actor not found.
      </div>
    );
  }

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": actor.name,
    "image": actor.profile_photo,
    "url": typeof window !== 'undefined' ? window.location.href : '',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <AdBanner type="top_banner" className="h-24 mb-6" />
      <SEO 
         title={`${actor.name} Videos & Profile`} 
         description={`Watch the latest videos featuring ${actor.name}.`} 
         image={actor.profile_photo}
      />
      <Helmet>
         <script type="application/ld+json">
           {JSON.stringify(personSchema)}
         </script>
      </Helmet>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
         {/* Profile Card */}
         <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
            <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden p-4 text-center">
               <img 
                 src={actor.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=800000&color=fff&size=300`} 
                 alt={actor.name} 
                 className="w-full aspect-[2/3] object-cover rounded-xl border border-[#2a2a2a] mb-4" 
                 referrerPolicy="no-referrer" 
                 onError={(e) => { 
                   e.currentTarget.onerror = null;
                   e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=800000&color=fff&size=300`; 
                 }} 
               />
               <h1 className="text-2xl font-bold text-white mb-1">{actor.name}</h1>
               <p className="text-gray-400 text-sm mb-4">📹 {actorVids.length} Videos</p>
               {actor.bio && (
                 <p className="text-gray-300 text-sm italic">{actor.bio}</p>
               )}
            </div>
         </div>
         
         <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2a2a2a] pb-2">Videos featuring {actor.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {actorVids.map(video => (
                 <VideoCard key={video.id} video={video} />
              ))}
            </div>
            {actorVids.length === 0 && (
              <div className="text-gray-500 text-center py-12 bg-[#111] rounded-xl border border-[#2a2a2a]">
                 No videos currently available.
              </div>
            )}
         </div>
      </div>
      <AdBanner type="bottom_banner" className="h-24 mt-12" />
    </div>
  );
}
