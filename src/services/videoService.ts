import { collection, doc, setDoc, getDocs, getDoc, query, where, orderBy, limit, startAfter, deleteDoc, updateDoc, Timestamp, writeBatch, increment, onSnapshot, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export interface VideoData {
  id?: string;
  title: string;
  description?: string;
  thumbnail: string;
  videoUrl?: string;
  embedCode?: string;
  categoryId?: string;
  categoryIds?: string[];
  channelId?: string;
  channelName?: string;
  channelAvatar?: string;
  views: number;
  likes?: number;
  uploadedAt: any;
  authorUid: string;
  duration?: string;
  sourceWebsite?: string;
  actorIds?: string[];
  tags?: string[];
}

export const fetchVideos = async (pageSize: number = 30, page: number = 1, filters?: {categoryId?: string, channelId?: string, actorId?: string, sortBy?: string}) => {
  try {
    const sortField = filters?.sortBy || 'uploadedAt';
    let q = query(collection(db, 'videos'), orderBy(sortField, 'desc'));
    
    if (filters?.categoryId) {
      q = query(q, where('categoryIds', 'array-contains', filters.categoryId));
    } else if (filters?.channelId) {
      q = query(q, where('channelId', '==', filters.channelId));
    } else if (filters?.actorId) {
      q = query(q, where('actorIds', 'array-contains', filters.actorId));
    }

    q = query(q, limit(pageSize * page));
    const snapshot = await getDocs(q);
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const allFetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
    const videos = allFetched.slice(start, end);

    return { videos, total: allFetched.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'videos');
    return { videos: [], total: 0 };
  }
};

export const fetchVideosCount = async (filters?: {categoryId?: string, channelId?: string, actorId?: string}) => {
  try {
    let coll = collection(db, 'videos') as any;
    if (filters?.categoryId) {
      coll = query(coll, where('categoryIds', 'array-contains', filters.categoryId));
    } else if (filters?.channelId) {
      coll = query(coll, where('channelId', '==', filters.channelId));
    } else if (filters?.actorId) {
      coll = query(coll, where('actorIds', 'array-contains', filters.actorId));
    }
    
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting count', error);
    return 0;
  }
};

export const fetchAllVideos = async () => {
  try {
    const q = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'), limit(500));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'videos');
    return [];
  }
};

export const fetchVideoById = async (videoId: string) => {
  try {
    const docRef = doc(db, 'videos', videoId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as VideoData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `videos/${videoId}`);
    return null;
  }
};

export const incrementVideoViews = async (videoId: string) => {
  try {
    const docRef = doc(db, 'videos', videoId);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Failed to increment views', error);
  }
};

export const incrementVideoLikes = async (videoId: string, amount: number) => {
  try {
    const docRef = doc(db, 'videos', videoId);
    await updateDoc(docRef, {
      likes: increment(amount)
    });
  } catch (error) {
    console.error('Failed to update likes', error);
  }
};

export const subscribeToComments = (videoId: string, callback: (comments: any[]) => void) => {
  const q = query(collection(db, `videos/${videoId}/comments`), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(comments);
  }, (error) => {
    console.error(error);
  });
};

export const addComment = async (videoId: string, text: string) => {
  if (!auth.currentUser) return;
  try {
    const newDocRef = doc(collection(db, `videos/${videoId}/comments`));
    await setDoc(newDocRef, {
      text,
      authorUid: auth.currentUser.uid,
      authorEmail: auth.currentUser.email,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `videos/${videoId}/comments`);
  }
};

export const deleteComment = async (videoId: string, commentId: string) => {
  try {
    await deleteDoc(doc(db, `videos/${videoId}/comments`, commentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `videos/${videoId}/comments/${commentId}`);
  }
};

export const subscribeToVideos = (callback: (videos: VideoData[]) => void, limitCount: number = 300) => {
  const q = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
    callback(videos);
  }, (error) => {
    console.error('Subscribe to videos failed', error);
  });
};

export const subscribeToStats = (callback: (stats: any) => void) => {
  // Normally would require an aggregation, but we'll mock the live increment on the client based on DB changes, or fetch totals if we had an aggregations doc.
  // For simplicity, we just return a hook that fetches the video count
  getDocs(collection(db, 'videos')).then(snap => {
    callback({ totalVideos: snap.size });
  }).catch(() => {});
};
