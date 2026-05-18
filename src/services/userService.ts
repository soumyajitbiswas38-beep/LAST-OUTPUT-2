import { collection, doc, setDoc, getDocs, getDoc, query, where, orderBy, deleteDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { VideoData } from './videoService';

const ensureUserDoc = async () => {
  if (!auth.currentUser) return;
  const userRef = doc(db, 'users', auth.currentUser.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: auth.currentUser.email,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const toggleUserAction = async (actionType: 'likedVideos' | 'watchLater' | 'history' | 'followedChannels', id: string, add: boolean) => {
  if (!auth.currentUser) return;
  await ensureUserDoc();
  try {
    const docRef = doc(db, `users/${auth.currentUser.uid}/${actionType}/${id}`);
    if (add) {
      // For history, update document if it exists, or create new. 
      // Our rules require create to have createdAt = request.time
      await setDoc(docRef, { createdAt: serverTimestamp() });
    } else {
      await deleteDoc(docRef);
    }
  } catch (error) {
    handleFirestoreError(error, add ? OperationType.CREATE : OperationType.DELETE, `users/${auth.currentUser.uid}/${actionType}/${id}`);
  }
};

export const getUserActionIds = async (actionType: 'likedVideos' | 'watchLater' | 'history' | 'followedChannels') => {
  if (!auth.currentUser) return [];
  try {
    const q = query(collection(db, `users/${auth.currentUser.uid}/${actionType}`), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser.uid}/${actionType}`);
    return [];
  }
};

export const getUserActionVideos = async (actionType: 'likedVideos' | 'watchLater' | 'history') => {
  if (!auth.currentUser) return [];
  try {
    const q = query(collection(db, `users/${auth.currentUser.uid}/${actionType}`), orderBy('createdAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    const videoIds = snap.docs.map(doc => doc.id);
    
    // Fetch actual video data
    const videos: VideoData[] = [];
    // Firestore in query limit is 30, so we can do it in batches or just get each one.
    // Since we limit to 30, one by one is ok for now.
    for (const vid of videoIds) {
      const vSnap = await getDoc(doc(db, 'videos', vid));
      if (vSnap.exists()) {
        videos.push({ id: vSnap.id, ...vSnap.data() } as VideoData);
      }
    }
    return videos;
  } catch (error) {
    console.error(error);
    return [];
  }
};
