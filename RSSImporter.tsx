import React, { useState } from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';
import Parser from 'rss-parser/dist/rss-parser.min.js';
import { uploadVideo } from '../services/adminService';

// Proxy to avoid CORS
const CORS_PROXY = "https://api.allorigins.win/get?url=";

export default function RSSImporter({ channels, categories }: { channels: any[], categories: any[] }) {
  const [rssUrl, setRssUrl] = useState('');
  const [channelId, setChannelId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleImport = async () => {
    if (!rssUrl || !channelId) {
      alert("Please enter RSS URL and select a Channel");
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const response = await fetch(CORS_PROXY + encodeURIComponent(rssUrl));
      if (!response.ok) throw new Error("Failed to fetch RSS via proxy");
      
      const data = await response.json();
      const parser = new Parser({
        customFields: {
          item: [
            ['media:thumbnail', 'mediaThumbnail'],
            ['media:content', 'mediaContent'],
            ['video:duration', 'duration'],
          ],
        }
      });
      const feed = await parser.parseString(data.contents);

      let count = 0;
      const channelName = channels.find(c => c.id === channelId)?.name || '';

      for (const item of feed.items) {
        // basic mapping
        const title = item.title || "Untitled";
        const description = item.contentSnippet || item.content || "";
        const videoUrl = item.link || item.mediaContent?.['$']?.url || "";
        
        // Better thumbnail extraction
        let thumbnail = "https://via.placeholder.com/320x180?text=No+Thumb";
        if (item.mediaThumbnail?.['$']?.url) {
           thumbnail = item.mediaThumbnail['$'].url;
        } else if (item.mediaContent?.['media:thumbnail']?.[0]?.['$']?.url) {
           thumbnail = item.mediaContent['media:thumbnail'][0]['$'].url;
        } else if (item.enclosure?.url && item.enclosure?.type?.startsWith('image')) {
           thumbnail = item.enclosure.url;
        } else if (description) {
           // Try to extract from description if it's HTML
           const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
           if (imgMatch) thumbnail = imgMatch[1];
        }

        // Auto-detect category from feed categories if not manually selected
        let finalCategoryId = categoryId;
        if (!finalCategoryId && item.categories && item.categories.length > 0) {
           const catName = typeof item.categories[0] === 'string' ? item.categories[0] : (item.categories[0] as any)._ || (item.categories[0] as any).name;
           if (catName) {
              const existing = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
              if (existing) {
                finalCategoryId = existing.id;
              }
              // We could auto-create here but it might be too many. For now, just match existing.
           }
        }
        
        // Construct video object
        const videoData: any = {
           title,
           description,
           thumbnail,
           videoUrl,
           channelId,
           channelName,
           sourceWebsite: feed.title || new URL(item.link || 'http://unknown').hostname,
        };
        if (finalCategoryId) {
          videoData.categoryId = finalCategoryId;
          videoData.categoryIds = [finalCategoryId];
        }
        if (item.duration) videoData.duration = item.duration;
        
        await uploadVideo(videoData);
        count++;
      }
      setResult(`Successfully imported ${count} videos!`);
    } catch (err: any) {
      console.error(err);
      setResult("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <UploadCloud className="text-wine-500" />
        <h2 className="text-xl font-bold text-white">RSS Auto Importer</h2>
      </div>
      <p className="text-gray-400 mb-6 text-sm">Automatically import videos from RSS/XML feeds. Mapped properties include title, description, thumbnail, and duration.</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
         <input 
            type="text" 
            value={rssUrl}
            onChange={e => setRssUrl(e.target.value)}
            className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500"
            placeholder="https://example.com/feed.xml"
         />
         <select value={channelId} onChange={e => setChannelId(e.target.value)} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500">
            <option value="">Select Channel Target...</option>
            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
         <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-wine-500">
            <option value="">(Optional) Category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
         <button 
            disabled={importing}
            onClick={handleImport}
            className="bg-wine-600 hover:bg-wine-700 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-lg transition-colors whitespace-nowrap"
         >
            {importing ? "Importing..." : "Start Import"}
         </button>
      </div>

      {result && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${result.includes('failed') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
           <CheckCircle size={18} />
           {result}
        </div>
      )}
    </div>
  );
}
