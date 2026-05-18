import { collection, doc, setDoc, getDocs, deleteDoc, Timestamp, serverTimestamp, query, orderBy, onSnapshot, writeBatch, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export const addCategory = async (name: string) => {
  try {
    const newDocRef = doc(collection(db, 'categories'));
    await setDoc(newDocRef, { name });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'categories');
  }
};

export const subscribeToCategories = (callback: (categories: any[]) => void) => {
  return onSnapshot(collection(db, 'categories'), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const deleteCategory = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
  }
};

export const addChannel = async (name: string, avatarUrl: string) => {
  if (!auth.currentUser) return;
  try {
    const newDocRef = doc(collection(db, 'channels'));
    await setDoc(newDocRef, { 
      name,
      avatarUrl,
      authorUid: auth.currentUser.uid,
      subscribers: 0
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'channels');
  }
};

export const subscribeToChannels = (callback: (channels: any[]) => void) => {
  return onSnapshot(collection(db, 'channels'), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const deleteChannel = async (id: string) => {
  try {
    // Also delete or clear channelId from videos (optional, but requested for robustness)
    // For now, let's just delete the channel doc.
    await deleteDoc(doc(db, 'channels', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `channels/${id}`);
  }
};

export const updateChannel = async (id: string, name: string, avatarUrl: string) => {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'channels', id), { name, avatarUrl });
    
    // Propagate to all videos of this channel
    const videosQuery = query(collection(db, 'videos'), where('channelId', '==', id));
    const videosSnap = await getDocs(videosQuery);
    videosSnap.docs.forEach(vDoc => {
      batch.update(vDoc.ref, { channelName: name, channelAvatar: avatarUrl });
    });
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `channels/${id}`);
  }
};

export const updateChannelAvatar = async (id: string, avatarUrl: string) => {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'channels', id), { avatarUrl });
    
    // Propagate to all videos of this channel
    const videosQuery = query(collection(db, 'videos'), where('channelId', '==', id));
    const videosSnap = await getDocs(videosQuery);
    videosSnap.docs.forEach(vDoc => {
      batch.update(vDoc.ref, { channelAvatar: avatarUrl });
    });
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `channels/${id}`);
  }
};

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const uploadVideo = async (videoData: any) => {
  if (!auth.currentUser) return;
  try {
    const newDocRef = doc(collection(db, 'videos'));
    await setDoc(newDocRef, {
      ...videoData,
      views: 0,
      uploadedAt: serverTimestamp(),
      authorUid: auth.currentUser.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'videos');
  }
};

export const deleteVideo = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'videos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `videos/${id}`);
  }
};

export const updateVideo = async (id: string, videoData: any) => {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'videos', id), videoData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `videos/${id}`);
  }
};

export const subscribeToAds = (callback: (ads: any[]) => void) => {
  return onSnapshot(collection(db, 'ads'), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const updateAd = async (id: string, adData: any) => {
  try {
    await setDoc(doc(db, 'ads', id), adData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `ads/${id}`);
  }
};

export const deleteAd = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'ads', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `ads/${id}`);
  }
};
