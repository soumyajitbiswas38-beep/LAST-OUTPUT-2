import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { VideoData } from '../services/videoService';
import { Play, MoreVertical, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleUserAction } from '../services/userService';

export default function VideoCard({ video }: { video: VideoData }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [addedWatchLater, setAddedWatchLater] = useState(false);
  const { user } = useAuth();
  
  const handleWatchLater = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    if(video.id) {
       toggleUserAction('watchLater', video.id, true);
       setAddedWatchLater(true);
       setTimeout(() => setAddedWatchLater(false), 2000);
    }
    setTimeout(() => setShowMenu(false), 2000);
  }

  return (
    <div 
      className="flex flex-col gap-2 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/watch/${video.id}`} className="relative aspect-video rounded-xl overflow-hidden bg-[#161616]">
        <img 
          src={video.thumbnail || "https://via.placeholder.com/320x180?text=No+Thumbnail"} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const ent = e.currentTarget;
            if (!ent.src.includes('placeholder')) {
              ent.src = 'https://via.placeholder.com/320x320?text=No+Thumbnail';
            }
          }}
        />
        
        {/* Play Icon Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-12 h-12 rounded-full bg-wine-600/80 backdrop-blur flex items-center justify-center text-white shadow-[0_0_15px_rgba(128,0,0,0.8)] scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play fill="currentColor" size={20} className="ml-1" />
          </div>
        </div>

      </Link>

      <div className="flex gap-3 mt-1 px-1">
        <div className="shrink-0">
          <Link to={`/channel/${video.channelId}`} className="block">
            {video.channelAvatar ? (
               <img 
                 src={video.channelAvatar} 
                 className="w-9 h-9 rounded-full object-cover border border-[#2a2a2a] group-hover:border-wine-500 transition-colors" 
                 alt={video.channelName}
                 referrerPolicy="no-referrer"
                 onError={(e) => { e.currentTarget.src = `https://via.placeholder.com/150?text=${video.channelName?.charAt(0) || 'C'}`; }}
               />
            ) : (
               <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center font-bold text-white uppercase text-sm border border-[#2a2a2a] group-hover:border-wine-500 transition-colors">
                 {video.channelName?.charAt(0) || 'C'}
               </div>
            )}
          </Link>
        </div>
        <div className="flex flex-col overflow-hidden w-full relative">
          <div className="flex justify-between items-start">
            <Link to={`/watch/${video.id}`} className="text-white font-semibold text-sm line-clamp-2 leading-snug group-hover:text-wine-400 transition-colors pr-6">
              {video.title}
            </Link>
            <div className="relative">
              <button 
                onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
                className="text-gray-400 hover:text-white absolute -top-1 -right-1 p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-6 w-40 bg-[#161616] border border-[#2a2a2a] rounded-lg shadow-xl z-20 py-1" onMouseLeave={() => setShowMenu(false)}>
                  <button onClick={handleWatchLater} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white flex items-center gap-2">
                     {addedWatchLater ? (
                       <>
                         <Clock size={16} className="text-emerald-500" />
                         <span className="text-emerald-500">Added!</span>
                       </>
                     ) : (
                       <>
                         <Clock size={16} /> Watch Later
                       </>
                     )}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col text-[#aaa] text-xs mt-1">
            <Link to={`/channel/${video.channelId}`} className="hover:text-white transition-colors block">
              {video.channelName}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span>{video.views} views</span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span>{video.uploadedAt?.toDate?.().toLocaleDateString() || 'Recently'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
