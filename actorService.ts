import { collection, doc, setDoc, getDocs, getDoc, query, orderBy, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';

export interface ActorData {
  id?: string;
  name: string;
  slug: string;
  profile_photo: string;
  bio?: string;
  is_trending?: boolean;
}

export const fetchActors = async () => {
  try {
    const q = query(collection(db, 'actors'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActorData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'actors');
    return [];
  }
};

export const subscribeToActors = (callback: (actors: ActorData[]) => void) => {
  const q = query(collection(db, 'actors'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActorData)));
  }, (error) => {
    console.error(error);
  });
};

export const fetchActorBySlug = async (idOrSlug: string) => {
  try {
    const q = query(collection(db, 'actors'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const doc = snapshot.docs.find(d => d.data().slug === idOrSlug || d.id === idOrSlug);
    if (doc) {
      return { id: doc.id, ...doc.data() } as ActorData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'actors');
    return null;
  }
};

export const addActor = async (data: any) => {
  if (!auth.currentUser) return;
  try {
    const newDocRef = doc(collection(db, 'actors'));
    await setDoc(newDocRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'actors');
  }
};

export const updateActor = async (id: string, data: any) => {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'actors', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `actors/${id}`);
  }
};

export const deleteActor = async (id: string) => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'actors', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `actors/${id}`);
  }
};
