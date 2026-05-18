/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getThumbnailFromUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // XVideos
  if (url.includes('xvideos.com')) {
    const match = url.match(/video(\d+)/) || url.match(/embedframe\/(\d+)/);
    if (match) {
        const vidId = match[1];
        return `https://static-egc2.xvideos-cdn.com/videos/thumbs169ll/${vidId.substring(0,3)}/${vidId.substring(3,6)}/${vidId}/thumb.jpg`;
    }
  }

  // SpankBang
  if (url.includes('spankbang.com')) {
    const match = url.match(/spankbang\.com\/([0-9a-z]+)\/video/);
    if (match) {
        return `https://th.spankbang.com/${match[1]}/w:300/h:200/default.jpg`;
    }
  }

  // PornHub
  if (url.includes('pornhub.com')) {
    const match = url.match(/view_video\.php\?viewkey=([a-z0-9]+)/i) || url.match(/embed\/([a-z0-9]+)/i);
    if (match) {
        return `https://di.phncdn.com/videos/thumbnails/default/${match[1]}/1.jpg`;
    }
  }

  // RedTube
  if (url.includes('redtube.com')) {
    const match = url.match(/redtube\.com\/(\d+)/);
    if (match) {
      return `https://img02.redtubefiles.com/m=eaSaaiaaaa/videos/${match[1]}/1.jpg`;
    }
  }

  // YouPorn
  if (url.includes('youporn.com')) {
    const match = url.match(/watch\/(\d+)/);
    if (match) {
      return `https://di.ypncdn.com/videos/thumbnails/201801/01/${match[1]}/default.jpg`;
    }
  }

  // XHamster
  if (url.includes('xhamster.com')) {
    const match = url.match(/videos\/[^\d]*(\d+)/);
    if (match) {
      return `https://ic-thumbnails.xhcdn.com/videos/${match[1]}/1.jpg`;
    }
  }

  // TNAFlix
  if (url.includes('tnaflix.com')) {
    const match = url.match(/video\/(\d+)/);
    if (match) {
      return `https://cdn.tnaflix.com/tnaflix/videos/${match[1]}/1.jpg`;
    }
  }

  // Motherless
  if (url.includes('motherless.com')) {
    const match = url.match(/motherless\.com\/([0-9A-Z]+)/);
    if (match) {
      return `https://cdn5.cdn-motherless.com/thumbs/${match[1]}.jpg`;
    }
  }

  // Chaturbate (live preview)
  if (url.includes('chaturbate.com')) {
    const match = url.match(/chaturbate\.com\/([^\/\s]+)/);
    if (match && !['auth', 'registration', 'terms'].includes(match[1])) {
       return `https://roomimg.stream.chaturbate.com/roomimg/${match[1]}/playlist/1.jpg`;
    }
  }

  // Generic patterns for iframe srcs or video urls
  if (url.includes('mediadelivery.net') || url.includes('bunnycdn.com')) {
    // These usually have a pattern like .../play/VIDEO_ID
    // Try to find a UID
    const uidMatch = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    if (uidMatch) {
       // BunnyCDN often uses this pattern for thumbnails
       return url.replace(/\/play\/.*$/, `/thumbnails/thumbnail.jpg`).replace(/\/embed\/.*$/, `/thumbnails/thumbnail.jpg`);
    }
    return url.replace('/play/', '/thumbnail.jpg').replace('.mp4', '.jpg');
  }

  return null;
}

export function extractThumbnailFromEmbed(embedCode: string): string | null {
  if (!embedCode) return null;

  // 1. Look for explicit poster or data-thumbnail
  const posterMatch = embedCode.match(/poster=["']([^"']+)["']/i) || embedCode.match(/data-poster=["']([^"']+)["']/i);
  if (posterMatch) return posterMatch[1];

  const thumbAttrMatch = embedCode.match(/(?:thumb|thumbnail|thumbnailUrl|data-thumb|data-thumbnail)=["']([^"']+)["']/i);
  if (thumbAttrMatch) return thumbAttrMatch[1];

  // 1.5 JSON-LD or Metadata search string in raw text
  const jsonThumbMatch = embedCode.match(/"thumbnailUrl":\s*"([^"]+)"/i);
  if (jsonThumbMatch) return jsonThumbMatch[1];

  // 2. Look for any image URL in the embed that looks like a thumbnail
  const imgUrlMatch = embedCode.match(/https?:\/\/[^"'\s<>]+?\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"'\s<>]*)?/i);
  if (imgUrlMatch) return imgUrlMatch[1];

  // 3. Extract URL from src attribute and try to get thumb from it
  const srcMatch = embedCode.match(/src=["']([^"']+)["']/i);
  if (srcMatch) {
    const thumb = getThumbnailFromUrl(srcMatch[1]);
    if (thumb) return thumb;
  }

  // 4. Fallback search for any URL
  const urlMatch = embedCode.match(/https?:\/\/[^"'\s<>]+/);
  if (urlMatch) {
    const thumb = getThumbnailFromUrl(urlMatch[0]);
    if (thumb) return thumb;
  }

  return null;
}

export function extractTitleFromEmbed(embedCode: string): string | null {
  if (!embedCode) return null;
  
  // Try title attribute
  const titleMatch = embedCode.match(/title=["'](.*?)["']/i);
  if (titleMatch && titleMatch[1]) return titleMatch[1];

  // Try aria-label
  const ariaMatch = embedCode.match(/aria-label=["'](.*?)["']/i);
  if (ariaMatch && ariaMatch[1]) return ariaMatch[1];

  // Try to look for text content if it's a link
  const linkTextMatch = embedCode.match(/>(.*?)<\/a>/i);
  if (linkTextMatch && linkTextMatch[1]) return linkTextMatch[1];

  return null;
}

export function extractCategoryFromEmbed(embedCode: string): string | null {
  if (!embedCode) return null;
  // Some sites include categories in the embed or URL
  const catMatch = embedCode.match(/category=([^&"'\s]+)/i) || embedCode.match(/categories=([^&"'\s]+)/i);
  if (catMatch) return catMatch[1];
  return null;
}
