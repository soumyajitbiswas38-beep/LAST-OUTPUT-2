import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { fetchVideos, VideoData, fetchVideosCount } from '../services/videoService';
import { Heart } from 'lucide-react';
import { subscribeToChannels } from '../services/adminService';
import AdBanner from '../components/AdBanner';
import Pagination from '../components/Pagination';

export default function ChannelPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1');

  const [videos, setVideos] = useState<VideoData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<{name: string, avatarUrl: string, subscribers: number} | null>(null);

  const videosPerPage = 20;

  useEffect(() => {
    const unsubChan = subscribeToChannels((channelsData) => {
      const chan = channelsData.find(c => c.id === id);
      if (chan) setChannel(chan as any);
    });

    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [vidsData, count] = await Promise.all([
          fetchVideos(videosPerPage, pageParam, { channelId: id }),
          fetchVideosCount({ channelId: id })
        ]);
        setVideos(vidsData.videos);
        setTotalCount(count);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    loadData();
    return () => unsubChan();
  }, [id, pageParam]);

  const totalPages = Math.ceil(totalCount / videosPerPage) || 1;
  const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);

  return (
    <div className="p-6 max-w-[1800px] mx-auto w-full">
      <AdBanner type="top_banner" className="h-24 mb-6" />
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12 bg-[#161616] p-8 rounded-2xl border border-[#2a2a2a]">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 border-4 border-wine-500 shrink-0">
          {channel?.avatarUrl ? (
            <img 
              src={channel.avatarUrl} 
              alt={channel?.name} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={(e) => { 
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel?.name || 'C')}&background=800000&color=fff&size=128`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white bg-wine-900">
              {channel?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center md:items-start flex-1 justify-center">
          <h1 className="text-3xl font-bold text-white mb-2">{channel?.name || 'Loading Channel...'}</h1>
          <p className="text-gray-400 flex items-center gap-2">
            <Heart size={18} className="text-wine-500" /> {totalLikes} total likes
          </p>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2a2a2a] pb-2">Videos</h2>
      
      {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
            {[...Array(videosPerPage)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 animate-pulse">
                <div className="aspect-video bg-[#161616] rounded-xl"></div>
                <div className="h-4 bg-[#161616] rounded w-3/4"></div>
              </div>
            ))}
          </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video as any} />
            ))}
            {videos.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                No videos found in this channel.
              </div>
            )}
          </div>
          <Pagination 
            currentPage={pageParam} 
            totalPages={totalPages} 
            baseUrl={`/channel/${id}`} 
          />
        </>
      )}
      <AdBanner type="bottom_banner" className="h-24 mt-12" />
    </div>
  );
}
