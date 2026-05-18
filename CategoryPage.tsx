import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { fetchVideos, VideoData, fetchVideosCount } from '../services/videoService';
import { LayoutGrid } from 'lucide-react';
import { subscribeToCategories } from '../services/adminService';
import AdBanner from '../components/AdBanner';
import Pagination from '../components/Pagination';

export default function CategoryPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1');
  
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>('Category');
  
  const videosPerPage = 20;

  useEffect(() => {
    const unsubCat = subscribeToCategories((cats) => {
      const cat = cats.find(c => c.id === id);
      if (cat) setCategoryName(cat.name);
    });

    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [vidsData, count] = await Promise.all([
          fetchVideos(videosPerPage, pageParam, { categoryId: id }),
          fetchVideosCount({ categoryId: id })
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
    return () => unsubCat();
  }, [id, pageParam]);

  const totalPages = Math.ceil(totalCount / videosPerPage) || 1;

  return (
    <div className="p-6 max-w-[1800px] mx-auto w-full">
      <AdBanner className="h-24 mb-6" />
      <div className="flex items-center gap-3 mb-8">
        <LayoutGrid className="text-wine-500" />
        <h1 className="text-2xl font-bold text-white">{categoryName} Videos</h1>
      </div>
      
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
                No videos found in this category.
              </div>
            )}
          </div>
          <Pagination 
            currentPage={pageParam} 
            totalPages={totalPages} 
            baseUrl={`/category/${id}`} 
          />
        </>
      )}
      <AdBanner className="h-24 mt-12" />
    </div>
  );
}
