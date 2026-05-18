import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Video, Heart, Check, UploadCloud, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCategories, subscribeToChannels, addCategory, deleteCategory, addChannel, deleteChannel, uploadVideo, updateVideo, subscribeToUsers, updateChannel, updateChannelAvatar, deleteVideo } from '../services/adminService';
import { fetchVideos, VideoData } from '../services/videoService';
import { subscribeToActors, ActorData, addActor, updateActor, deleteActor } from '../services/actorService';
import { subscribeToAds, updateAd, AdData } from '../services/adService';
import ImageUpsert from '../components/ImageUpsert';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import RSSImporter from '../components/RSSImporter';
import { extractThumbnailFromEmbed, extractTitleFromEmbed, extractCategoryFromEmbed, getThumbnailFromUrl } from '../lib/videoUtils';

export default function Admin() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [channels, setChannels] = useState<{id: string, name: string, avatarUrl?: string}[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [actors, setActors] = useState<ActorData[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  
const AdCard = ({ type, ad }: { type: string, ad: any }) => {
  const [adCode, setAdCode] = useState(ad.adCode || '');

  useEffect(() => {
    setAdCode(ad.adCode || '');
  }, [ad.adCode]);

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-4 rounded-lg flex flex-col gap-3">
      <div className="flex justify-between items-center whitespace-nowrap">
        <h3 className="text-white font-medium capitalize">{type.replace('_', ' ')}</h3>
        <label className="flex items-center gap-2 cursor-pointer group">
          <span className="text-xs text-gray-400 group-hover:text-emerald-500 transition-colors">{ad.active !== false ? 'Enabled' : 'Disabled'}</span>
          <div className={`w-5 h-5 rounded border border-[#2a2a2a] flex items-center justify-center transition-all ${ad.active !== false ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent'}`}>
            <Check size={14} className={`text-white ${ad.active !== false ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <input 
            type="checkbox" 
            className="hidden"
            checked={ad.active !== false} 
            onChange={(e) => updateAd(type, { ...ad, active: e.target.checked })} 
          />
        </label>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Paste Ad Code or Ad Link</label>
        <div className="flex flex-col gap-2">
          <textarea 
            className="w-full bg-[#161616] border border-[#2a2a2a] rounded text-white px-2 py-2 text-sm focus:outline-none focus:border-wine-500 min-h-[100px] resize-y font-mono" 
            value={adCode} 
            onChange={e => setAdCode(e.target.value)} 
            placeholder="<iframe... or <script... or https://..."
          />
          <button onClick={() => updateAd(type, { ...ad, adCode, active: true })} className="bg-wine-600 hover:bg-wine-700 text-white px-4 py-2 rounded text-sm transition-colors self-end">Save Ad</button>
        </div>
      </div>
    </div>
  );
};
  const [newCat, setNewCat] = useState('');
  const [newChan, setNewChan] = useState('');
  const [newChanAvatarUrl, setNewChanAvatarUrl] = useState('');
  const [editingChannel, setEditingChannel] = useState<any | null>(null);
  const [newActorName, setNewActorName] = useState('');
  const [newActorSlug, setNewActorSlug] = useState('');
  const [newActorPhoto, setNewActorPhoto] = useState('');
  const [newActorBio, setNewActorBio] = useState('');
  const [editingActor, setEditingActor] = useState<ActorData | null>(null);
  const [avatarUpdates, setAvatarUpdates] = useState<Record<string, string>>({});
  const [liveViews, setLiveViews] = useState(0);
  
  // Video Form
  const [vTitle, setVTitle] = useState('');
  const [vThumb, setVThumb] = useState('');
  const [vUrl, setVUrl] = useState('');
  const [vEmbedCode, setVEmbedCode] = useState('');
  const [vSourceWebsite, setVSourceWebsite] = useState('');
  const [vTags, setVTags] = useState('');
  const [vActorIds, setVActorIds] = useState<string[]>([]);
  const [vChannelId, setVChannelId] = useState('');
  const [vCategoryIds, setVCategoryIds] = useState<string[]>([]);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  const handleEmbedChange = async (val: string) => {
    setVEmbedCode(val);
    
    // Auto-detect title
    const extractedTitle = extractTitleFromEmbed(val);
    if (extractedTitle && !vTitle) {
      setVTitle(extractedTitle);
    }
    
    // Auto-detect thumbnail
    const extractedThumb = extractThumbnailFromEmbed(val);
    if (extractedThumb && !vThumb) {
      setVThumb(extractedThumb);
    } else if (!vThumb && val) {
      setVThumb('https://via.placeholder.com/640x360.png?text=Video+Preview');
    }

    // Auto-detect and ensure category
    const extractedCatName = extractCategoryFromEmbed(val);
    if (extractedCatName) {
      const existing = categories.find(c => c.name.toLowerCase() === extractedCatName.toLowerCase());
      if (existing) {
        if (!vCategoryIds.includes(existing.id)) {
          setVCategoryIds([...vCategoryIds, existing.id]);
        }
      } else {
        // Option to auto-create category
        try {
          await addCategory(extractedCatName);
          // Categories list will update via Firestore listener, but we might need to wait or handle it
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) return;
    
    const unsubCats = subscribeToCategories(setCategories);
    const unsubChans = subscribeToChannels(setChannels);
    const unsubUsers = subscribeToUsers(setUsersList);
    const unsubActors = subscribeToActors(setActors);
    const unsubAds = subscribeToAds(setAds);
    
    const unsubVideos = onSnapshot(collection(db, 'videos'), (snap) => {
      const vids = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
      setVideos(vids);
      const totalViews = vids.reduce((acc, v) => acc + (v.views || 0), 0);
      setLiveViews(totalViews);
    });

    return () => {
      unsubCats();
      unsubChans();
      unsubUsers();
      unsubActors();
      unsubAds();
      unsubVideos();
    };
  }, [user]);

  const handleUpload = async () => {
    const activeChannelId = vChannelId || (channels.length > 0 ? channels[0].id : null);
    
    if (!vTitle || !vThumb || (!vUrl && !vEmbedCode)) {
      alert("Missing required fields: Title, Thumbnail, and either Video URL or Embed Code.");
      return;
    }
    
    const data: any = {
      title: vTitle,
      thumbnail: vThumb,
    };
    
    if (activeChannelId) {
      data.channelId = activeChannelId;
      const chan = channels.find(c => c.id === activeChannelId);
      data.channelName = chan?.name || '';
      data.channelAvatar = chan?.avatarUrl || '';
    }
    
    if (vUrl) data.videoUrl = vUrl;
    if (vEmbedCode) data.embedCode = vEmbedCode;
    if (vCategoryIds.length > 0) data.categoryIds = vCategoryIds;
    if (vCategoryIds.length > 0) data.categoryId = vCategoryIds[0]; // Set first as main for compatibility
    if (vSourceWebsite) data.sourceWebsite = vSourceWebsite;
    if (vTags) data.tags = vTags.split(',').map(t => t.trim()).filter(Boolean);
    if (vActorIds.length > 0) data.actorIds = vActorIds;
    
    try {
      if (editingVideoId) {
        await updateVideo(editingVideoId, data);
        setEditingVideoId(null);
      } else {
        await uploadVideo(data);
      }
      setVTitle(''); setVDescription(''); setVThumb(''); setVUrl(''); setVEmbedCode(''); setVSourceWebsite(''); setVTags(''); setVActorIds([]); setVChannelId(''); setVCategoryIds([]);
    } catch (e) {
      console.error(e);
      alert('Failed to upload/update video. Check console for details.');
    }
  };

  const loadIntoForm = (video: VideoData) => {
    setEditingVideoId(video.id || null);
    setVTitle(video.title || '');
    setVThumb(video.thumbnail || '');
    setVUrl(video.videoUrl || '');
    setVEmbedCode(video.embedCode || '');
    setVSourceWebsite(video.sourceWebsite || '');
    setVTags(video.tags ? video.tags.join(', ') : '');
    setVActorIds(video.actorIds || []);
    setVChannelId(video.channelId || '');
    setVCategoryIds(video.categoryIds || (video.categoryId ? [video.categoryId] : []));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stats = [
    { name: 'Total Registered Users', value: usersList.length, icon: Users, color: 'text-wine-500' },
    { name: 'Total Views (Real)', value: liveViews.toLocaleString(), icon: BarChart3, color: 'text-wine-500' },
    { name: 'Total Channels', value: channels.length, icon: Users, color: 'text-wine-500' },
    { name: 'Total Videos', value: videos.length, icon: Video, color: 'text-wine-500' },
    { name: 'Total Categories', value: categories.length, icon: Heart, color: 'text-wine-500' },
  ];

  if (!user?.isAdmin) {
    return <div className="p-6 text-white text-center">Unauthorized. Log in as admin.</div>;
  }

  return (
    <div className="p-6 w-full max-w-7xl mx-auto flex flex-col gap-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Creator Studio</h1>
        <p className="text-gray-400 mt-1">Manage your platform content, categories, and channels</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-[#161616] border border-[#2a2a2a] p-5 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-[#2a2a2a] ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Upload Section */}
        <div className="xl:col-span-2 bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <UploadCloud className="text-wine-500" /> {editingVideoId ? 'Edit Video' : 'Upload New Video'}
          </h2>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Video Title</label>
              <input 
                type="text" value={vTitle} onChange={e => setVTitle(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500" 
                placeholder="Enter video title" 
              />
            </div>
            
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Channel</label>
                  <select value={vChannelId} onChange={e => setVChannelId(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500">
                    <option value="">Select Channel</option>
                    {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Categories</label>
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-2 max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                    {categories.map(cat => {
                      const isSelected = vCategoryIds.includes(cat.id);
                      return (
                        <div 
                          key={cat.id}
                          onClick={() => {
                            if (isSelected) {
                              setVCategoryIds(vCategoryIds.filter(id => id !== cat.id));
                            } else {
                              setVCategoryIds([...vCategoryIds, cat.id]);
                            }
                          }}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border transition-all ${isSelected ? 'bg-wine-600/20 border-wine-500 text-white' : 'bg-[#161616] border-transparent text-gray-400 hover:bg-[#222]'}`}
                        >
                          <span className="text-xs truncate">{cat.name}</span>
                          {isSelected && <Check size={12} className="ml-auto text-wine-500" />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Click to select/deselect categories</p>
                </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <ImageUpsert 
                  label="Thumbnail"
                  type="videos"
                  initialUrl={vThumb}
                  onImageChange={setVThumb}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-400 block">Video URL</label>
                  <button 
                    onClick={() => {
                      const thumb = extractThumbnailFromEmbed(vUrl) || getThumbnailFromUrl(vUrl);
                      if (thumb) setVThumb(thumb);
                    }}
                    className="text-[10px] bg-[#2a2a2a] hover:bg-wine-600 text-white px-2 py-0.5 rounded transition-colors"
                  >
                    Fetch Thumb
                  </button>
                </div>
                <input 
                  value={vUrl} 
                  onChange={e => setVUrl(e.target.value)} 
                  onBlur={() => {
                    const thumb = extractThumbnailFromEmbed(vUrl) || getThumbnailFromUrl(vUrl);
                    if (thumb && !vThumb) setVThumb(thumb);
                  }}
                  type="text" 
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500" 
                  placeholder="https://example.com/video.mp4" 
                />
                {vUrl && (
                  <div className="mt-2">
                    {vUrl.includes('iframe') || vUrl.includes('mediadelivery.net/play') || vUrl.includes('bunnycdn.com/play') ? (
                       <iframe src={vUrl.match(/src="([^"]+)"/)?.[1] || vUrl} className="w-full h-32 rounded-lg border border-[#2a2a2a] bg-black" allowFullScreen />
                    ) : (
                       <video src={vUrl} controls className="w-full h-32 object-cover rounded-lg border border-[#2a2a2a] bg-black" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-400 block">Embed Code</label>
                  <button 
                    onClick={() => handleEmbedChange(vEmbedCode)}
                    className="text-[10px] bg-[#2a2a2a] hover:bg-wine-600 text-white px-2 py-0.5 rounded transition-colors"
                  >
                    Fetch Info
                  </button>
                </div>
                <textarea 
                  value={vEmbedCode} 
                  onChange={e => setVEmbedCode(e.target.value)} 
                  onBlur={() => handleEmbedChange(vEmbedCode)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500 h-24" 
                  placeholder="<iframe src='...' />" 
                />
                {vEmbedCode && (
                  <div className="mt-2 w-full h-32 relative rounded-lg border border-[#2a2a2a] overflow-hidden bg-black [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:top-0 [&_iframe]:left-0 [&_iframe]:border-0">
                    {vEmbedCode.trim().startsWith('http') ? (
                      <iframe src={vEmbedCode.trim()} className="w-full h-full absolute top-0 left-0 border-0" allowFullScreen />
                    ) : (
                      <div className="w-full h-full absolute inset-0 [&_div]:!h-full [&_div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full" dangerouslySetInnerHTML={{ __html: vEmbedCode }}></div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Tags (comma separated)</label>
                  <input value={vTags} onChange={e => setVTags(e.target.value)} type="text" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500" placeholder="action, comedy, drama" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Source Website</label>
                    <input value={vSourceWebsite} onChange={e => setVSourceWebsite(e.target.value)} type="text" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500" placeholder="YouTube" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Actors</label>
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-2 max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                    {actors.map(actor => {
                      const isSelected = vActorIds.includes(actor.id!);
                      return (
                        <div 
                          key={actor.id}
                          onClick={() => {
                            if (isSelected) {
                              setVActorIds(vActorIds.filter(id => id !== actor.id));
                            } else {
                              setVActorIds([...vActorIds, actor.id!]);
                            }
                          }}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border transition-all ${isSelected ? 'bg-wine-600/20 border-wine-500 text-white' : 'bg-[#161616] border-transparent text-gray-400 hover:bg-[#222]'}`}
                        >
                          <span className="text-xs truncate">{actor.name}</span>
                          {isSelected && <Check size={12} className="ml-auto text-wine-500" />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Click to select/deselect actors</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4 w-full sm:w-auto self-end">
              {editingVideoId && (
                <button onClick={() => {
                  setEditingVideoId(null);
                  setVTitle(''); setVThumb(''); setVUrl(''); setVChannelId(''); setVCategoryIds([]);
                }} className="bg-[#2a2a2a] hover:bg-[#333] text-white font-medium py-3 rounded-lg transition-colors px-8">
                  Cancel Edit
                </button>
              )}
              <button onClick={handleUpload} className="bg-wine-600 hover:bg-wine-700 text-white font-medium py-3 rounded-lg transition-colors px-8 shadow-[0_0_15px_rgba(128,0,0,0.3)]">
                {editingVideoId ? 'Save Changes' : 'Proceed to Upload'}
              </button>
            </div>
          </div>
        </div>

        {/* Categories & Channels Management */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Manage Categories</h2>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                placeholder="New category..." 
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-wine-500"
              />
              <button 
                onClick={async () => {
                  if(newCat) {
                    try {
                      await addCategory(newCat);
                      setNewCat('');
                    } catch (e) {
                      console.error(e);
                      alert('Failed to add category');
                    }
                  }
                }}
                className="bg-[#2a2a2a] hover:bg-[#333] text-white p-2 rounded-lg transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#2a2a2a] p-2 px-3 rounded-lg">
                  <span className="text-sm text-gray-300">{cat.name}</span>
                  <button 
                    onClick={async () => {
                      try {
                        await deleteCategory(cat.id);
                      } catch (err: any) {
                        console.error(`Failed to delete category: ${err.message}`);
                      }
                    }}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">{editingChannel ? 'Edit Channel' : 'Manage Channels'}</h2>
            <div className="flex flex-col gap-4 mb-4">
              <input 
                type="text" 
                value={newChan}
                onChange={e => setNewChan(e.target.value)}
                placeholder="Channel name..." 
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-wine-500"
              />
              
              <ImageUpsert 
                label="Channel Avatar"
                type="channels"
                initialUrl={newChanAvatarUrl}
                onImageChange={setNewChanAvatarUrl}
              />

              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    if (newChan) {
                      try {
                        if (editingChannel) {
                          await updateChannel(editingChannel.id, newChan, newChanAvatarUrl);
                          setEditingChannel(null);
                        } else {
                          await addChannel(newChan, newChanAvatarUrl);
                        }
                        setNewChan('');
                        setNewChanAvatarUrl('');
                      } catch (e) {
                        console.error(e);
                        alert('Failed to save channel');
                      }
                    }
                  }}
                  className="flex-1 bg-wine-600 hover:bg-wine-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {editingChannel ? 'Save Changes' : 'Create Channel'}
                </button>
                {editingChannel && (
                  <button 
                    onClick={() => {
                      setEditingChannel(null);
                      setNewChan('');
                      setNewChanAvatarUrl('');
                    }}
                    className="bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
              {channels.map(chan => (
                <div key={chan.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#2a2a2a] p-2 px-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                      {chan.avatarUrl ? (
                         <img 
                           src={chan.avatarUrl} 
                           className="w-full h-full object-cover" 
                           alt="" 
                           referrerPolicy="no-referrer" 
                           onError={(e) => { 
                             e.currentTarget.onerror = null;
                             e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chan.name)}&background=random&color=fff&size=50`; 
                           }} 
                         />
                      ) : (
                         <span className="text-[10px] font-bold text-white">{chan.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-300 truncate">{chan.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditingChannel(chan);
                        setNewChan(chan.name);
                        setNewChanAvatarUrl(chan.avatarUrl || '');
                      }}
                      className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          if (chan.avatarUrl && chan.avatarUrl.startsWith('/uploads/')) {
                            await fetch('/api/images/delete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path: chan.avatarUrl })
                            });
                          }
                          await deleteChannel(chan.id);
                        } catch (err: any) {
                          console.error(`Failed to delete channel: ${err.message}`);
                        }
                      }}
                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">{editingActor ? 'Edit Actor' : 'Manage Actors'}</h2>
            <div className="flex flex-col gap-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={newActorName}
                  onChange={e => setNewActorName(e.target.value)}
                  placeholder="Actor name..." 
                  className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500"
                />
                <input 
                  type="text" 
                  value={newActorSlug}
                  onChange={e => setNewActorSlug(e.target.value)}
                  placeholder="Slug (e.g. mia-khalifa)" 
                  className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500"
                />
              </div>
              
              <textarea 
                value={newActorBio}
                onChange={e => setNewActorBio(e.target.value)}
                placeholder="Short bio..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500 h-20 resize-none"
              />

              <ImageUpsert 
                label="Profile Photo"
                type="pornstars"
                initialUrl={newActorPhoto}
                onImageChange={setNewActorPhoto}
              />

              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    if (newActorName && newActorSlug) {
                      const data = { 
                        name: newActorName, 
                        slug: newActorSlug, 
                        profile_photo: newActorPhoto, 
                        bio: newActorBio,
                        is_trending: editingActor?.is_trending || false 
                      };
                      try {
                        if (editingActor) {
                          await updateActor(editingActor.id!, data);
                          setEditingActor(null);
                        } else {
                          await addActor(data);
                        }
                        setNewActorName('');
                        setNewActorSlug('');
                        setNewActorPhoto('');
                        setNewActorBio('');
                      } catch (e) {
                         alert('Failed to save actor');
                      }
                    }
                  }}
                  className="flex-1 bg-wine-600 hover:bg-wine-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {editingActor ? 'Save Changes' : 'Add Actor'}
                </button>
                {editingActor && (
                  <button 
                    onClick={() => {
                      setEditingActor(null);
                      setNewActorName('');
                      setNewActorSlug('');
                      setNewActorPhoto('');
                      setNewActorBio('');
                    }}
                    className="bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              {actors.map(actor => (
                <div key={actor.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#2a2a2a] p-2 px-3 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {actor.profile_photo ? (
                      <img 
                        src={actor.profile_photo} 
                        alt={actor.name} 
                        className="w-8 h-8 rounded-full object-cover shrink-0" 
                        referrerPolicy="no-referrer"
                        onError={(e) => { 
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=800000&color=fff&size=50`; 
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {actor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="text-white font-medium text-sm">{actor.name}</div>
                      <div className="text-gray-500 text-xs">/{actor.slug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditingActor(actor);
                        setNewActorName(actor.name);
                        setNewActorSlug(actor.slug);
                        setNewActorPhoto(actor.profile_photo || '');
                        setNewActorBio(actor.bio || '');
                      }}
                      className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          if (actor.profile_photo && actor.profile_photo.startsWith('/uploads/')) {
                            await fetch('/api/images/delete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path: actor.profile_photo })
                            });
                          }
                          await deleteActor(actor.id!);
                        } catch (err: any) {
                          console.error(`Failed to delete actor: ${err.message}`);
                        }
                      }}
                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Ad Management */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mt-6">
        <h2 className="text-xl font-bold text-white mb-4">Ad Management</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {['top_banner', 'bottom_banner', 'video_ad', 'popup_ad', 'desc_ad'].map(type => {
            const ad = ads.find(a => a.type === type) || { type, adCode: '', active: true };
            return <AdCard key={type} type={type} ad={ad} />;
          })}
        </div>
      </div>

      <RSSImporter channels={channels} categories={categories} />

      {/* Recent Videos Table */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Uploads</h2>
         </div>
         
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-gray-400">
             <thead className="text-xs uppercase bg-[#2a2a2a] text-gray-300">
               <tr>
                 <th className="px-4 py-3 rounded-l-lg">Video</th>
                 <th className="px-4 py-3">Category</th>
                 <th className="px-4 py-3">Channel</th>
                 <th className="px-4 py-3">Views</th>
                 <th className="px-4 py-3 rounded-r-lg">Actions</th>
               </tr>
             </thead>
             <tbody>
               {videos.slice(0, 10).map(video => (
                 <tr key={video.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]/50 transition-colors">
                   <td className="px-4 py-3">
                     <div className="flex items-center gap-3">
                       <img src={video.thumbnail || "https://via.placeholder.com/160x100?text=No+Thumb"} className="w-16 h-10 object-cover rounded" alt="" referrerPolicy="no-referrer" />
                       <span className="text-white font-medium line-clamp-1">{video.title}</span>
                     </div>
                   </td>
                   <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#2a2a2a] rounded-md text-xs">{categories.find(c => c.id === video.categoryId)?.name || 'None'}</span>
                   </td>
                   <td className="px-4 py-3">{video.channelName}</td>
                   <td className="px-4 py-3">{video.views}</td>
                   <td className="px-4 py-3 flex items-center gap-2">
                     <button onClick={() => loadIntoForm(video as any)} className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"><Edit size={16}/></button>
                     <button onClick={async () => {
                       try {
                         await deleteVideo(video.id);
                       } catch (err: any) {
                         console.error(`Failed to delete video: ${err.message}`);
                       }
                     }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/20 rounded transition-colors"><Trash2 size={16}/></button>
                   </td>
                 </tr>
               ))}
               {videos.length === 0 && (
                 <tr><td colSpan={5} className="py-8 text-center text-gray-500">No videos uploaded yet</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Registered Users</h2>
         </div>
         
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-gray-400">
             <thead className="text-xs uppercase bg-[#2a2a2a] text-gray-300">
               <tr>
                 <th className="px-4 py-3 rounded-l-lg">User ID</th>
                 <th className="px-4 py-3">Email</th>
                 <th className="px-4 py-3 rounded-r-lg">Joined At</th>
               </tr>
             </thead>
             <tbody>
               {usersList.slice(0, 10).map(u => (
                 <tr key={u.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]/50 transition-colors">
                   <td className="px-4 py-3 font-mono text-xs">{u.id}</td>
                   <td className="px-4 py-3 text-white font-medium">{u.email}</td>
                   <td className="px-4 py-3">{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                 </tr>
               ))}
               {usersList.length === 0 && (
                 <tr><td colSpan={4} className="py-8 text-center text-gray-500">No users found</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>

    </div>
  );
}
