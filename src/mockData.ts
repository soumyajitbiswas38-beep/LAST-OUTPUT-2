export const categories = [
  "Amateur",
  "Couple",
  "VR",
  "Licking",
  "Stepsis",
  "Stepmom"
];

export const channels = [
  "AmateurChef",
  "AdrenalineRush",
  "VR Studio",
  "FitLife Duo",
  "AnimeGains",
  "Roleplay Masters",
  "Premium Hub"
];

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  author: string;
  authorAvatar: string;
  is4K: boolean;
  category: string;
  likes: string;
  uploadedAt: string;
}

export const mockVideos: Video[] = [
  {
    id: "v1",
    title: "Amateur College Fun",
    thumbnail: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=2070&auto=format&fit=crop",
    duration: "14:20",
    views: "1.2M",
    author: "AmateurHub",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    is4K: true,
    category: "Amateur",
    likes: "45K",
    uploadedAt: "2 days ago"
  },
  {
    id: "v2",
    title: "Step-sister POV Adventure",
    thumbnail: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop",
    duration: "08:45",
    views: "890K",
    author: "Roleplay Masters",
    authorAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=150&auto=format&fit=crop",
    is4K: true,
    category: "Stepsis",
    likes: "120K",
    uploadedAt: "5 hours ago"
  },
  {
    id: "v3",
    title: "Intense Couple Session",
    thumbnail: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=2000&auto=format&fit=crop",
    duration: "22:15",
    views: "3.4M",
    author: "FitLife Duo",
    authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
    is4K: false,
    category: "Couple",
    likes: "210K",
    uploadedAt: "1 week ago"
  },
  {
    id: "v4",
    title: "VR Interactive Experience",
    thumbnail: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=2070&auto=format&fit=crop",
    duration: "11:30",
    views: "450K",
    author: "VR Studio",
    authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop",
    is4K: true,
    category: "VR",
    likes: "22K",
    uploadedAt: "3 days ago"
  },
  {
    id: "v5",
    title: "Licking ASMR",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop",
    duration: "18:05",
    views: "2.1M",
    author: "ASMR Hub",
    authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&auto=format&fit=crop",
    is4K: true,
    category: "Licking",
    likes: "89K",
    uploadedAt: "1 month ago"
  },
  {
    id: "v6",
    title: "Step-mom's Secret",
    thumbnail: "https://images.unsplash.com/photo-1506744626753-1fa7673e5e2b?q=80&w=2000&auto=format&fit=crop",
    duration: "25:00",
    views: "5.6M",
    author: "Premium Hub",
    authorAvatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?q=80&w=150&auto=format&fit=crop",
    is4K: false,
    category: "Stepmom",
    likes: "400K",
    uploadedAt: "2 weeks ago"
  }
];
