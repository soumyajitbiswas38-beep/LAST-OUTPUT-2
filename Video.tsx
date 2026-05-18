import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Plus, Flag, MessageSquare, Heart, Clock, Trash2 } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import AdBanner from '../components/AdBanner';
import { useAuth } from '../context/AuthContext';
import { subscribeToComments, addComment, incrementVideoLikes, fetchVideoById, VideoData, incrementVideoViews, fetchVideos, deleteComment } from '../services/videoService';
import { subscribeToCategories } from '../services/adminService';
import { toggleUserAction, getUserActionIds } from '../services/userService';
import LoginModal from '../components/LoginModal';
import SEO from '../components/SEO';
import { Helmet } from 'react-helmet-async';
import { X, Settings, ChevronDown, Monitor } from 'lucide-react';
import PopupAd from '../components/PopupAd';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchActors, ActorData } from '../services/actorService';

export default function VideoPlayer() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState<VideoData | null>(null);
  const [channelAvatar, setChannelAvatar] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [recommended, setRecommended] = useState<VideoData[]>([]);
  const [recommendedPage, setRecommendedPage] = useState(1);
  const recommendedPerPage = 15;
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [actors, setActors] = useState<ActorData[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [similarVideos, setSimilarVideos] = useState<VideoData[]>([]);
  const [selectedResolution, setSelectedResolution] = useState('1080p');
  const [showResMenu, setShowResMenu] = useState(false);

  useEffect(() => {
    // Popup ad every 30 seconds
    const interval = setInterval(() => {
      setShowPopup(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchActors().then(setActors);
    const unsub = subscribeToCategories(setCategories);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    const loadVideo = async () => {
      setLoading(true);
      const data = await fetchVideoById(id);
      setVideo(data as any);
      if (data) {
        if (data.channelId) {
          getDoc(doc(db, 'channels', data.channelId)).then(snap => {
            if (snap.exists() && snap.data().avatarUrl) {
              setChannelAvatar(snap.data().avatarUrl);
            }
          });
        }
        incrementVideoViews(id);
        
        // Fetch similar videos
        const { fetchVideos } = await import('../services/videoService');
        const similarRes = await fetchVideos(20, 1, { categoryId: data.categoryId });
        setSimilarVideos(similarRes.videos.filter(v => v.id !== id));

        // Popup ad logic
        const count = parseInt(localStorage.getItem('videoClickCount') || '0') + 1;
        localStorage.setItem('videoClickCount', count.toString());
        if (count % 3 === 0) {
          setShowPopup(true);
        }
      }
      setLoading(false);
    };
    loadVideo();
    
    // Add to history
    if (user && id) {
      toggleUserAction('history', id, true);
    }
  }, [id, user]);

  useEffect(() => {
    if (user && id) {
      getUserActionIds('likedVideos').then(ids => setIsLiked(ids.includes(id)));
      getUserActionIds('watchLater').then(ids => setIsWatchLater(ids.includes(id)));
    }
  }, [user, id]);

  useEffect(() => {
    // Fetch 30 videos to allow for 2 pages of 15
    fetchVideos(30).then(res => setRecommended(res.videos.filter(v => v.id !== id)));
  }, [id]);

  const visibleRecommended = recommended.slice(0, recommendedPage * recommendedPerPage);
  const hasMoreRecommended = recommended.length > recommendedPage * recommendedPerPage;

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToComments(id, (comms) => setComments(comms));
    return () => unsub();
  }, [id]);

  const handleLike = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    if (id) {
      toggleUserAction('likedVideos', id, newLiked);
      import('../services/videoService').then(({ incrementVideoLikes }) => {
        incrementVideoLikes(id, newLiked ? 1 : -1);
      });
    }
  };

  const handleWatchLater = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    const newVal = !isWatchLater;
    setIsWatchLater(newVal);
    if(id) toggleUserAction('watchLater', id, newVal);
  };

  const submitComment = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (newComment.trim() && id) {
      await addComment(id, newComment);
      setNewComment('');
    }
  };

  if (loading) return <div className="p-12 text-center text-white">Loading video...</div>;
  if (!video) return <div className="p-12 text-center text-white">Video not found.</div>;

  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description || video.title,
    "thumbnailUrl": [video.thumbnail],
    "uploadDate": video.uploadedAt?.toDate ? video.uploadedAt.toDate().toISOString() : new Date().toISOString(),
    "duration": video.duration ? `PT${video.duration.replace(':', 'M')}S` : "PT1M",
    "embedUrl": video.videoUrl || "",
    "interactionCount": video.views.toString()
  };

  const videoActors = video?.actorIds ? actors.filter(a => video.actorIds?.includes(a.id!)) : [];

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto p-4 lg:p-6 gap-6">
      <SEO 
        title={video.title} 
        description={video.description || `Watch ${video.title} on Xbucket`} 
        image={video.thumbnail} 
        type="video.other"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(videoSchema)}
        </script>
      </Helmet>
      
      <AdBanner type="top_banner" className="h-16 sm:h-20 mb-2" />

      {/* Main Video Section */}
      <div className="flex-1 w-full flex flex-col gap-4">
        {/* Ad Banner Above Player */}
        <AdBanner type="video_ad" className="h-16" />

        {/* Name and Category (before Video) */}
        <div>
           <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{video.title}</h1>
           <div className="flex items-center text-sm mt-1 gap-2">
             <button 
                onClick={() => video.categoryId && navigate(`/category/${video.categoryId}`)}
                className="text-wine-500 font-semibold hover:underline"
             >
                {categories.find(c => c.id === video.categoryId)?.name || video.categoryId || 'General'}
             </button>
             <span className="text-gray-500">•</span>
             <span className="text-gray-400">{video.views} views</span>
           </div>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group border border-[#2a2a2a] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {video.embedCode ? (
            video.embedCode.trim().startsWith('http') ? (
              <iframe 
                src={video.embedCode.trim()} 
                className="w-full h-full absolute top-0 left-0 border-0" 
                allowFullScreen 
              />
            ) : (
              <div 
                dangerouslySetInnerHTML={{ __html: video.embedCode }} 
                className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:top-0 [&_iframe]:left-0 [&_iframe]:border-0" 
              />
            )
          ) : video.videoUrl?.includes('iframe') || video.videoUrl?.includes('mediadelivery.net/play') || video.videoUrl?.includes('bunnycdn.com/play') ? (
            <iframe 
              src={video.videoUrl.match(/src="([^"]+)"/)?.[1] || video.videoUrl} 
              className="w-full h-full absolute top-0 left-0 border-0" 
              allowFullScreen 
            />
          ) : video.videoUrl ? (
            <video 
              src={video.videoUrl} 
              poster={video.thumbnail || undefined} 
              controls 
              autoPlay
              className="w-full h-full object-contain" 
            />
          ) : (
            <>
              {video.thumbnail && (
                <img src={video.thumbnail} className="w-full h-full object-cover opacity-80" alt="Player Poster" referrerPolicy="no-referrer" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                 <button className="w-20 h-20 bg-wine-600/90 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(128,0,0,0.8)] hover:scale-110 transition-transform text-white">
                    <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2"></div>
                 </button>
              </div>
            </>
          )}

          {/* Resolution Picker (Beside Fullscreen area) */}
          <div className="absolute bottom-2 right-12 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button 
                onClick={() => setShowResMenu(!showResMenu)}
                className="bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded hover:bg-black/60 transition-all text-[10px] font-bold border border-white/10"
              >
                {selectedResolution}
              </button>
              {showResMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-24 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl py-1">
                  {['4K', '1080p', '720p', '480p', '360p'].map(res => (
                    <button 
                      key={res}
                      onClick={() => {
                        setSelectedResolution(res);
                        setShowResMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[10px] font-medium transition-colors ${selectedResolution === res ? 'bg-wine-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Channel Info & Actions */}
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 border-y border-[#2a2a2a]">
             <div className="flex items-center gap-3">
                <Link to={`/channel/${video.channelId}`} className="block shrink-0">
                  {channelAvatar ? (
                    <img 
                      src={channelAvatar} 
                      className="w-12 h-12 rounded-full object-cover border border-gray-700 bg-gray-800" 
                      alt={video.channelName || 'Channel'} 
                      referrerPolicy="no-referrer" 
                      onError={(e) => { 
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName || 'C')}&background=800000&color=fff&size=50`; 
                      }} 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border border-gray-700 bg-gray-800 flex items-center justify-center uppercase text-white font-bold shrink-0">
                       {video.channelName?.charAt(0) || 'C'}
                    </div>
                  )}
                </Link>
                <div>
                   <Link to={`/channel/${video.channelId}`} className="text-white font-bold hover:text-wine-400 transition-colors block">
                     {video.channelName || 'Unknown Channel'}
                   </Link>
                   <p className="text-gray-400 text-xs">Published on {video.uploadedAt?.toDate?.().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) || 'Recently'}</p>
                </div>
             </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                <button 
                 onClick={handleLike}
                 className={`flex items-center gap-2 px-6 py-2 rounded-full transition-colors ${isLiked ? 'bg-wine-600 text-white' : 'bg-[#161616] text-gray-300 hover:bg-[#2a2a2a]'}`}
                >
                  <ThumbsUp size={18} className={isLiked ? "fill-current" : ""} />
                  <span className="text-sm font-medium">{video.likes || 0}</span>
                </button>
                <button 
                 onClick={handleWatchLater}
                 className={`flex items-center gap-2 px-6 py-2 rounded-full transition-colors ${isWatchLater ? 'bg-wine-600 text-white' : 'bg-[#161616] text-gray-300 hover:bg-[#2a2a2a]'}`}
                >
                  <Clock size={18} className={isWatchLater ? "fill-current" : ""} />
                  <span className="text-sm font-medium">Watch Later</span>
                </button>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2 py-4">
             {videoActors.map(actor => (
                <button 
                 key={actor.id} 
                 onClick={() => navigate(`/actor/${actor.id}`)}
                 className="bg-[#161616] hover:bg-wine-600/20 border border-[#2a2a2a] hover:border-wine-500/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all group"
                >
                  {actor.name}
                </button>
              ))}
              {(video.categoryIds || [video.categoryId]).map(catId => catId && (
                <button 
                 key={catId}
                 onClick={() => navigate(`/category/${catId}`)}
                 className="bg-[#161616] hover:bg-wine-600/20 border border-[#2a2a2a] hover:border-wine-500/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all group"
                >
                  {categories.find(c => c.id === catId)?.name || catId}
                </button>
              ))}
           </div>

          <AdBanner type="desc_ad" className="h-20 sm:h-24 opacity-80" />
          
          {/* Recommended Videos (Now in main flow) */}
          <div className="w-full flex flex-col gap-4 mt-4">
             <h3 className="text-lg font-bold text-white">More Videos</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleRecommended.map(v => (
                   <div key={v.id} className="flex flex-col gap-2 group hover:bg-[#161616] p-2 rounded-xl border border-transparent hover:border-[#2a2a2a] transition-all">
                     <div onClick={() => navigate(`/watch/${v.id}`)} className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#161616] cursor-pointer">
                       <img src={v.thumbnail || "https://via.placeholder.com/320x180?text=No+Thumbnail"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/320x180?text=No+Thumbnail'; }} />
                     </div>
                     <div className="flex flex-col">
                        <h4 onClick={() => navigate(`/watch/${v.id}`)} className="text-white text-sm font-bold line-clamp-2 leading-snug group-hover:text-wine-400 transition-colors cursor-pointer">{v.title}</h4>
                        <Link to={`/channel/${v.channelId}`} className="text-[#aaa] text-xs mt-1 hover:text-white transition-colors block">{v.channelName}</Link>
                        <p className="text-[#aaa] text-xs pb-1 opacity-70">{v.views} views • {v.uploadedAt?.toDate?.().toLocaleDateString() || 'Recently'}</p>
                     </div>
                   </div>
                ))}
             </div>

             {hasMoreRecommended ? (
                <>
                  <button 
                    onClick={() => setRecommendedPage(prev => prev + 1)}
                    className="w-full py-3 bg-[#161616] hover:bg-[#2a2a2a] text-white font-medium rounded-xl transition-colors mt-2 border border-[#2a2a2a]"
                  >
                    See more videos
                  </button>
                  <AdBanner className="h-24 mt-4 mb-2" />
                </>
             ) : (
                <AdBanner className="h-24 mt-4 mb-2" />
             )}
          </div>

          {/* Comments Section */}
          <div className="mt-6 flex flex-col gap-6 border-t border-[#2a2a2a] pt-6">
             <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-white">{comments.length} Comments</h3>
                <MessageSquare size={20} className="text-gray-400" />
             </div>
             
             {user ? (
               <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-wine-800 flex items-center justify-center text-white shrink-0">
                   {user.email?.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 flex flex-col items-end gap-2">
                   <input
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     className="w-full bg-transparent border-b border-gray-600 focus:border-white text-white py-1 outline-none transition-colors"
                     placeholder="Add a comment..."
                   />
                   <button 
                     onClick={submitComment}
                     disabled={!newComment.trim()}
                     className="px-4 py-1.5 bg-white text-black font-medium rounded-full disabled:opacity-50"
                   >
                     Comment
                   </button>
                 </div>
               </div>
             ) : (
               <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <MessageSquare size={32} className="text-wine-500 mb-2" />
                  <h4 className="text-white font-semibold mb-1">Sign in to comment</h4>
                  <p className="text-sm text-gray-400 mb-4">Join the conversation and reply to other users.</p>
                  <button onClick={() => setShowLogin(true)} className="px-6 py-2 bg-wine-600 hover:bg-wine-700 text-white font-medium rounded-full transition-colors">
                    Sign In
                  </button>
               </div>
             )}
                       <div className="flex flex-col gap-6 mt-4">
               {comments.map((comment) => (
                 <div key={comment.id} className="flex gap-4 group">
                   <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white shrink-0">
                     {comment.authorEmail?.charAt(0).toUpperCase() || 'U'}
                   </div>
                   <div className="flex flex-1 flex-col">
                     <div className="flex items-center justify-between">
                       <span className="text-gray-400 text-xs font-semibold">
                         {comment.authorEmail?.split('@')[0] || 'User'} 
                         <span className="font-normal ml-2">{comment.createdAt?.toDate?.().toLocaleDateString() || ''}</span>
                       </span>
                       {(user?.isAdmin || (user && user.uid === comment.authorUid)) && (
                         <button 
                           onClick={() => id && deleteComment(id, comment.id)}
                           className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                           title="Delete Comment"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}
                     </div>
                     <p className="text-white mt-1 text-sm">{comment.text}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Similar Videos Section */}
           {similarVideos.length > 0 && (
             <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
                <h3 className="text-xl font-bold text-white mb-6">Similar Content You Might Like</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {similarVideos.slice(0, 12).map(v => (
                    <VideoCard key={v.id} video={v as any} />
                  ))}
                </div>
             </div>
           )}
        </div>
      </div>
      
      {/* Bottom Ad Banner */}
      <AdBanner type="bottom_banner" className="h-24 w-full mt-6" />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showPopup && <PopupAd onClose={() => setShowPopup(false)} />}
    </div>
  );
}
