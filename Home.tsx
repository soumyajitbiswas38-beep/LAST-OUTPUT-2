import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import CategorySlider from '../components/CategorySlider';
import VideoCard from '../components/VideoCard';
import { fetchVideos, VideoData, fetchVideosCount } from '../services/videoService';
import AdBanner from '../components/AdBanner';
import Pagination from '../components/Pagination';

export default function Home() {
  const [searchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1');
  
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const videosPerPage = 20;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [vidsData, count] = await Promise.all([
          fetchVideos(videosPerPage, pageParam),
          fetchVideosCount()
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
  }, [pageParam]);

  const totalPages = Math.ceil(totalCount / videosPerPage) || 1;

  return (
    <div className="flex flex-col w-full h-full pb-8 relative">
      <CategorySlider />
      
      <div className="w-full max-w-6xl mx-auto mt-6 px-4">
        <AdBanner type="top_banner" />
      </div>

      <div className="px-4 lg:px-8 mt-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Discovered
            <div className="w-2 h-2 rounded-full bg-wine-500 shadow-[0_0_8px_rgba(128,0,0,1)] animate-pulse"></div>
          </h2>
        </div>
        
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
             {[...Array(videosPerPage)].map((_, i) => (
               <div key={i} className="flex flex-col gap-3 animate-pulse">
                 <div className="aspect-video bg-[#161616] rounded-xl"></div>
                 <div className="h-4 bg-[#161616] rounded w-3/4"></div>
                 <div className="h-3 bg-[#161616] rounded w-1/2"></div>
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
                <div className="col-span-full text-center py-12 text-gray-500">
                  No videos available yet.
                </div>
              )}
            </div>
            
            <Pagination 
              currentPage={pageParam} 
              totalPages={totalPages} 
              baseUrl="/" 
            />
          </>
        )}
      </div>
      
      <div className="w-full max-w-6xl mx-auto mt-12 px-4 mb-4">
        <AdBanner type="bottom_banner" />
      </div>

    </div>
  );
}
