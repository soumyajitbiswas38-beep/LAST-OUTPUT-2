import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { TrendingUp, Clock, ThumbsUp, History, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import { getUserActionVideos } from '../services/userService';
import { fetchVideos, VideoData, fetchVideosCount } from '../services/videoService';
import AdBanner from '../components/AdBanner';
import Pagination from '../components/Pagination';

interface Props {
  title: string;
  type: 'trending' | 'watch-later' | 'liked' | 'history' | 'channels';
}

export default function VideoGridPage({ title, type }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1');
  
  const [showLogin, setShowLogin] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const videosPerPage = 20;

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    
    const loadData = async () => {
      try {
        if (type === 'trending') {
          const [vidsData, count] = await Promise.all([
            fetchVideos(videosPerPage, pageParam, { sortBy: 'views' }),
            fetchVideosCount()
          ]);
          setVideos(vidsData.videos);
          setTotalCount(count);
          setLoading(false);
        } else if (type === 'liked') {
          if (user) {
            const vids = await getUserActionVideos('likedVideos');
            setVideos(vids);
          }
          setLoading(false);
        } else if (type === 'watch-later') {
          if (user) {
            const vids = await getUserActionVideos('watchLater');
            setVideos(vids);
          }
          setLoading(false);
        } else if (type === 'history') {
          if (user) {
            const vids = await getUserActionVideos('history');
            setVideos(vids);
          }
          setLoading(false);
        } else if (type === 'channels') {
          setVideos([]);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    loadData();
  }, [type, user, authLoading, pageParam]);

  const totalPages = Math.ceil(totalCount / videosPerPage) || 1;

  const getIcon = () => {
    switch (type) {
      case 'trending': return <TrendingUp className="text-wine-500" />;
      case 'watch-later': return <Clock className="text-wine-500" />;
      case 'liked': return <ThumbsUp className="text-wine-500" />;
      case 'history': return <History className="text-wine-500" />;
      case 'channels': return <Heart className="text-wine-500" />;
    }
  };

  const isAuthRequired = type === 'watch-later' || type === 'liked' || type === 'history' || type === 'channels';

  if (!authLoading && isAuthRequired && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-8 max-w-md w-full">
          <div className="flex justify-center flex-col items-center">
            {getIcon()}
          </div>
          <h2 className="text-2xl font-bold text-white mt-4 mb-2">{title}</h2>
          <p className="text-gray-400 mb-6">Create an account or sign in to view your {title.toLowerCase()}.</p>
          <button 
            onClick={() => setShowLogin(true)}
            className="px-6 py-3 bg-wine-600 hover:bg-wine-700 text-white font-medium rounded-full transition-colors w-full"
          >
            Sign In
          </button>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto w-full">
      <AdBanner className="h-24 mb-6" />
      <div className="flex items-center gap-3 mb-8">
        {getIcon()}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading videos...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video as any} />
          ))}
          {videos.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No videos found.
            </div>
          )}
        </div>
      )}

      {type === 'trending' && (
        <Pagination 
          currentPage={pageParam} 
          totalPages={totalPages} 
          baseUrl="/trending" 
        />
      )}

      <AdBanner className="h-24 mt-12" />
    </div>
  );
}
