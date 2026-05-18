import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { subscribeToVideos, VideoData } from '../services/videoService';
import { fetchActors } from '../services/actorService';
import { Search } from 'lucide-react';
import AdBanner from '../components/AdBanner';

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
  
  const words = lowerText.split(/\s+/);
  let maxSim = 0;
  for (const word of words) {
    const longerLength = Math.max(word.length, lowerSearch.length);
    const distance = levDistance(word, lowerSearch);
    const sim = (longerLength - distance) / parseFloat(longerLength.toString());
    if (sim > maxSim) maxSim = sim;
  }
  
  const longerLength = Math.max(lowerText.length, lowerSearch.length);
  const distanceFull = levDistance(lowerText, lowerSearch);
  const simFull = (longerLength - distanceFull) / parseFloat(longerLength.toString());
  
  return Math.max(maxSim, simFull);
}

export default function SearchPage() {
  const { term } = useParams();
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<VideoData[]>([]);
  const [otherVideos, setOtherVideos] = useState<VideoData[]>([]);

  useEffect(() => {
    setLoading(true);
    
    // Using a simple fetch for actors as they don't change often in search context
    const loadActors = async () => {
      const actors = await fetchActors();
      return actors;
    };

    let unsub: () => void;
    
    loadActors().then(allActors => {
      unsub = subscribeToVideos((allVideos) => {
        const searchStr = term?.toLowerCase().trim() || '';
        
        const matchedWithSim = allVideos.map(video => {
          const titleSim = getSimilarity(video.title, searchStr);
          const channelSim = getSimilarity(video.channelName || '', searchStr);
          const catSim = getSimilarity(video.categoryId || '', searchStr);
          const descSim = getSimilarity(video.description || '', searchStr);
          
          let tagsSim = 0;
          if ((video as any).tags) {
             tagsSim = Math.max(...(video as any).tags.map((t: string) => getSimilarity(t, searchStr)));
          }

          let actorsSim = 0;
          if ((video as any).actorIds && Array.isArray((video as any).actorIds)) {
             const videoActors = allActors.filter(a => (video as any).actorIds.includes(a.id));
             if (videoActors.length > 0) {
                actorsSim = Math.max(...videoActors.map(a => getSimilarity(a.name, searchStr)));
             }
          }

          const maxSim = Math.max(titleSim, channelSim, catSim, descSim, tagsSim, actorsSim);
          return { video, maxSim };
        });

        const matched: VideoData[] = [];
        const others: VideoData[] = [];

        matchedWithSim.sort((a, b) => b.maxSim - a.maxSim).forEach(item => {
          if (item.maxSim > 0.4) {
            matched.push(item.video);
          } else {
            others.push(item.video);
          }
        });

        setSearchResults(matched);
        setOtherVideos(others);
        setLoading(false);
      }, 500);
    });

    return () => unsub?.();
  }, [term]);

  return (
    <div className="p-6 max-w-[1800px] mx-auto w-full">
      <AdBanner className="h-24 mb-6" />
      <div className="flex items-center gap-3 mb-8">
        <Search className="text-wine-500" />
        <h1 className="text-2xl font-bold text-white">Search Results for "{term}"</h1>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Searching videos...</div>
      ) : (
        <div className="flex flex-col gap-12">
          {searchResults.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
                {searchResults.map((video) => (
                  <VideoCard key={video.id} video={video as any} />
                ))}
              </div>
            </div>
          ) : (
             <div className="py-8 text-center text-gray-400 bg-[#161616] rounded-xl border border-[#2a2a2a]">
                No exact matches found for "{term}". Here are some other videos you might like:
             </div>
          )}

          {otherVideos.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2a2a2a] pb-2">Other Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
                {otherVideos.slice(0, 30).map((video) => (
                  <VideoCard key={video.id} video={video as any} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <AdBanner className="h-24 mt-12" />
    </div>
  );
}
