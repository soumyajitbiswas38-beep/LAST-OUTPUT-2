import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, Video, User, LogOut, Users, LayoutGrid } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import { subscribeToVideos, VideoData } from '../services/videoService';
import { subscribeToChannels, subscribeToCategories } from '../services/adminService';

// Levenshtein distance
function levDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[m][n];
}

function getSimilarity(text: string, searchStr: string): number {
  if (!text || !searchStr) return 0;
  const lowerText = text.toLowerCase();
  const lowerSearch = searchStr.toLowerCase();
  
  if (lowerText.includes(lowerSearch)) return 1.0;
  
  // Fuzzy match on words
  const words = lowerText.split(/\s+/);
  let maxSim = 0;
  for (const word of words) {
    const longerLength = Math.max(word.length, lowerSearch.length);
    const distance = levDistance(word, lowerSearch);
    const sim = (longerLength - distance) / parseFloat(longerLength.toString());
    if (sim > maxSim) maxSim = sim;
  }
  
  // Also check whole string
  const longerLength = Math.max(lowerText.length, lowerSearch.length);
  const distanceFull = levDistance(lowerText, lowerSearch);
  const simFull = (longerLength - distanceFull) / parseFloat(longerLength.toString());
  
  return Math.max(maxSim, simFull);
}

type SearchResultItem = {
  id: string;
  title: string;
  type: 'video' | 'channel' | 'category' | 'actor';
  url: string;
  similarity: number;
};

export default function Navbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);
  const [allChannels, setAllChannels] = useState<{id: string, name: string}[]>([]);
  const [allCategories, setAllCategories] = useState<{id: string, name: string}[]>([]);
  const [allActors, setAllActors] = useState<any[]>([]);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubVids = subscribeToVideos(setAllVideos);
    const unsubChan = subscribeToChannels(setAllChannels);
    const unsubCat = subscribeToCategories(setAllCategories);
    const unsubActors = import('../services/actorService').then(({ subscribeToActors }) => subscribeToActors(setAllActors));
    return () => {
      unsubVids();
      unsubChan();
      unsubCat();
      unsubActors.then(unsub => unsub?.());
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const searchStr = searchTerm.trim();
    let currentResults: SearchResultItem[] = [];

    // Check Categories
    allCategories.forEach(cat => {
      const sim = getSimilarity(cat.name, searchStr);
      if (sim > 0.4) {
        currentResults.push({ id: cat.id, title: cat.name, type: 'category', url: `/category/${cat.id}`, similarity: sim });
      }
    });

    // Check Channels
    allChannels.forEach(chan => {
      const sim = getSimilarity(chan.name, searchStr);
      if (sim > 0.4) {
        currentResults.push({ id: chan.id, title: chan.name, type: 'channel', url: `/channel/${chan.id}`, similarity: sim });
      }
    });

    // Check Actors
    allActors.forEach(actor => {
      const sim = getSimilarity(actor.name, searchStr);
      if (sim > 0.4) {
        currentResults.push({ id: actor.id, title: actor.name, type: 'actor', url: `/actor/${actor.id}`, similarity: sim });
      }
    });

    // Check Videos
    allVideos.forEach(vid => {
      const simMatch = Math.max(
        getSimilarity(vid.title, searchStr),
        vid.description ? getSimilarity(vid.description, searchStr) : 0
      );
      if (simMatch > 0.4) {
        currentResults.push({ id: vid.id!, title: vid.title, type: 'video', url: `/watch/${vid.id}`, similarity: simMatch });
      }
    });

    // Sort by Similarity
    currentResults.sort((a, b) => b.similarity - a.similarity);
    // Suggest top 10
    setResults(currentResults.slice(0, 10));
  }, [searchTerm, allCategories, allChannels, allVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsFocused(false);
      navigate(`/search/${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-[#0a0a0a]/90 backdrop-blur border-b border-[#161616] h-16 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-[#161616] rounded-full transition-colors text-gray-300 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Video size={28} className="text-wine-600 relative z-10" />
              <div className="absolute inset-0 bg-wine-600/30 blur-md rounded-full group-hover:bg-wine-600/50 transition-colors"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Xbucket</span>
          </Link>
        </div>

        <div className="flex-1 max-w-2xl mx-4 hidden md:block" ref={wrapperRef}>
          <form onSubmit={handleSearch} className="relative group">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Search videos, actors, categories..." 
              className="w-full bg-[#161616] text-white border border-[#2a2a2a] rounded-full py-2 pl-4 pr-10 focus:outline-none focus:border-wine-600 focus:shadow-[0_0_15px_rgba(128,0,0,0.3)] transition-all"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-wine-500 transition-colors">
              <Search size={20} />
            </button>
            
            {/* Search Dropdown */}
            {isFocused && searchTerm.trim() && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden py-2 z-50">
                {results.length > 0 ? (
                  results.map((item, idx) => (
                    <button
                      key={`${item.type}-${item.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        setIsFocused(false);
                        navigate(item.url);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors text-left"
                    >
                       <div className="text-gray-400 shrink-0">
                         {item.type === 'video' && <Video size={16} />}
                         {item.type === 'actor' && <User size={16} />}
                         {item.type === 'channel' && <Users size={16} />}
                         {item.type === 'category' && <LayoutGrid size={16} />}
                       </div>
                       <div className="flex-1 overflow-hidden">
                         <span className="text-sm font-medium text-white truncate block">{item.title}</span>
                         <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                       </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-gray-400 text-sm mb-3">No results found.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFocused(false);
                        navigate('/');
                      }}
                      className="text-wine-500 hover:text-wine-400 text-sm font-medium"
                    >
                      Browse other videos
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (input) input.focus();
            }}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            <Search size={24} />
          </button>
          {user ? (
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-[#161616] hover:bg-[#2a2a2a] text-white rounded-full transition-colors ml-2 border border-[#2a2a2a]"
            >
              <LogOut size={18} className="text-wine-500" />
              <span className="text-sm font-medium hidden sm:block">Sign Out</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white rounded-full transition-colors ml-2 shadow-[0_0_10px_rgba(128,0,0,0.2)]"
            >
              <User size={18} />
              <span className="text-sm font-medium">Sign In</span>
            </button>
          )}
        </div>
      </nav>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
