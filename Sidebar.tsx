import React from 'react';
import { Home, Compass, Clock, ThumbsUp, History, PlaySquare, Heart, Users, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const links = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Trending', icon: Compass, path: '/trending' },
    { name: 'Categories', icon: List, path: '/categories' },
    { name: 'Pornstars', icon: Users, path: '/pornstars' },
    { name: 'Channels', icon: Heart, path: '/channels' },
    { name: 'Watch Later', icon: Clock, path: '/watch-later' },
    { name: 'Liked Videos', icon: ThumbsUp, path: '/liked' },
    { name: 'History', icon: History, path: '/history' },
  ];

  if (user?.isAdmin) {
    links.push({ name: 'Admin Panel', icon: PlaySquare, path: '/admin' });
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside 
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-[#0a0a0a] border-r border-[#161616] overflow-y-auto transition-transform duration-300 z-40 w-64 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex-1 py-4 flex flex-col gap-2 px-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path}
                onClick={onClose}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all
                  ${isActive ? 'bg-wine-950/50 text-white border-l-2 border-wine-500' : 'text-gray-400 hover:bg-[#161616] hover:text-white'}
                `}
                title={link.name}
              >
                <Icon size={24} className={isActive ? 'text-wine-500 drop-shadow-[0_0_8px_rgba(128,0,0,0.8)]' : ''} />
                <span className="font-medium whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Footer Info */}
        <div className="p-4 text-xs text-gray-600">
          <p>Terms · Privacy · DMCA</p>
          <p className="mt-1">© 2026 Xbucket</p>
        </div>
      </aside>
    </>
  );
}
