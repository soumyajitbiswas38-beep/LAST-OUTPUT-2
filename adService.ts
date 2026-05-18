import { collection, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';

export interface AdData {
  id?: string;
  type: string; // e.g. "top_banner", "bottom_banner"
  imageUrl: string;
  targetUrl: string;
  active: boolean;
}

export const subscribeToAds = (callback: (ads: AdData[]) => void) => {
  return onSnapshot(collection(db, 'ads'), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdData)));
  }, (error) => {
    console.error(error);
  });
};

export const updateAd = async (id: string, data: Partial<AdData>) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'ads', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
       await setDoc(docRef, data);
    } else {
       await updateDoc(docRef, data);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `ads/${id}`);
    throw error;
  }
};
