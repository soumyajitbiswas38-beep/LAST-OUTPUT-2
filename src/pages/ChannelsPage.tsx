import React, { useEffect, useState } from 'react';
import { Heart, Users } from 'lucide-react';
import { subscribeToChannels } from '../services/adminService';
import { fetchAllVideos } from '../services/videoService';
import { Link } from 'react-router-dom';
import AdBanner from '../components/AdBanner';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<{id: string, name: string, avatarUrl: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelLikes, setChannelLikes] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsub = subscribeToChannels((data) => {
      setChannels(data);
      setLoading(false);
    });
    
    // Fetch videos to calculate likes
    fetchAllVideos().then(videos => {
      const likesMap: Record<string, number> = {};
      videos.forEach(v => {
        if (!likesMap[v.channelId]) likesMap[v.channelId] = 0;
        likesMap[v.channelId] += (v.likes || 0);
      });
      setChannelLikes(likesMap);
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-6 max-w-[1800px] mx-auto w-full">
      <AdBanner type="top_banner" className="h-24 mb-6" />
      <div className="flex items-center gap-3 mb-8">
        <Heart className="text-wine-500" />
        <h1 className="text-2xl font-bold text-white">All Channels</h1>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading channels...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {channels.map((channel) => (
            <div key={channel.id} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 flex flex-col items-center hover:border-wine-500 transition-colors cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-gray-800 mb-4 overflow-hidden border-2 border-transparent group-hover:border-wine-500 transition-colors flex items-center justify-center font-bold text-3xl text-white">
                {channel.avatarUrl ? (
                  <img src={channel.avatarUrl} alt={channel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = `https://via.placeholder.com/150?text=${channel.name.charAt(0).toUpperCase()}`; }} />
                ) : (
                  <span>{channel.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-wine-400 transition-colors text-center line-clamp-1">{channel.name}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1"><Heart size={14} className="text-wine-500" /> {channelLikes[channel.id] || 0} total likes</p>
              
              <Link to={`/channel/${channel.id}`} className="mt-6 w-full py-2 bg-[#2a2a2a] hover:bg-wine-600 text-white font-medium rounded-lg transition-colors text-center block">
                View Channel
              </Link>
            </div>
          ))}
          {channels.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No channels available.
            </div>
          )}
        </div>
      )}
      <AdBanner type="bottom_banner" className="h-24 mt-12" />
    </div>
  );
}
