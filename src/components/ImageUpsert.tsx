import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link as LinkIcon, Loader2, X, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImageUpsertProps {
  initialUrl?: string;
  type: 'pornstars' | 'channels' | 'videos';
  onImageChange: (url: string) => void;
  label?: string;
}

export default function ImageUpsert({ initialUrl, type, onImageChange, label = 'Image' }: ImageUpsertProps) {
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = type === 'videos';

  useEffect(() => {
    setCurrentUrl(initialUrl || '');
  }, [initialUrl]);

  const handleImport = async () => {
    if (!urlInput) return;
    
    // Just use the external URL directly instead of downloading to server
    setCurrentUrl(urlInput);
    onImageChange(urlInput);
    
    // Delete the old local file if there was one
    if (currentUrl.startsWith('/uploads/')) {
      try {
        await fetch('/api/images/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: currentUrl })
        });
      } catch (e) {
        console.error('Failed to cleanup old image', e);
      }
    }
    
    setUrlInput('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('type', type);
    if (currentUrl) formData.append('oldPath', currentUrl);
    formData.append('image', file);

    try {
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload image');

      setCurrentUrl(data.url);
      onImageChange(data.url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearImage = async () => {
    try {
      if (currentUrl.startsWith('/uploads/')) {
        await fetch('/api/images/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: currentUrl })
        });
      }
      setCurrentUrl('');
      onImageChange('');
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Preview Area */}
        <div className={`relative group w-full ${isVideo ? 'sm:w-56 aspect-video' : 'sm:w-32 aspect-[2/3] sm:aspect-square'} bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl overflow-hidden flex items-center justify-center shrink-0`}>
          {currentUrl ? (
            <>
              <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button 
                onClick={clearImage}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                title="Delete image"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <ImageIcon className="text-gray-700" size={32} />
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="text-wine-500 animate-spin" size={24} />
            </div>
          )}
        </div>

        {/* Controls Area */}
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste direct image URL..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-wine-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              />
            </div>
            <button 
              onClick={handleImport}
              disabled={loading || !urlInput}
              className="bg-wine-600 hover:bg-wine-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Import
            </button>
          </div>

          <div className="relative">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              accept="image/*"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-[#2a2a2a] border-dashed hover:border-wine-500/50 hover:bg-wine-500/5 text-gray-400 hover:text-wine-400 py-3 rounded-lg text-sm font-medium transition-all"
            >
              <Upload size={16} />
              Upload from Device
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-emerald-500 text-xs bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
              <CheckCircle2 size={14} />
              <span>Image updated successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
