import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Document paths will be:
// users/{userId}/state/paperTrading
// users/{userId}/state/watchlists
// users/{userId}/state/alerts

export const UserDataService = {
  async getPaperTrading(userId: string) {
    if (!userId) return null;
    try {
      const docRef = doc(db, "users", userId, "state", "paperTrading");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (e) {
      console.error("Failed to load paper trading from cloud", e);
      return null;
    }
  },

  async syncPaperTrading(userId: string, data: any) {
    if (!userId) return;
    try {
      const docRef = doc(db, "users", userId, "state", "paperTrading");
      await setDoc(docRef, data, { merge: true });
    } catch (e) {
      console.error("Failed to sync paper trading to cloud", e);
    }
  },

  async getWatchlists(userId: string) {
    if (!userId) return null;
    try {
      const docRef = doc(db, "users", userId, "state", "watchlists");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().lists;
      }
      return null;
    } catch (e) {
      console.error("Failed to load watchlists from cloud", e);
      return null;
    }
  },

  async syncWatchlists(userId: string, lists: any) {
    if (!userId) return;
    try {
      const docRef = doc(db, "users", userId, "state", "watchlists");
      await setDoc(docRef, { lists }, { merge: true });
    } catch (e) {
      console.error("Failed to sync watchlists to cloud", e);
    }
  },

  async getAlerts(userId: string) {
    if (!userId) return null;
    try {
      const docRef = doc(db, "users", userId, "state", "alerts");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (e) {
      console.error("Failed to load alerts from cloud", e);
      return null;
    }
  },

  async syncAlerts(userId: string, state: any) {
    if (!userId) return;
    try {
      const docRef = doc(db, "users", userId, "state", "alerts");
      await setDoc(docRef, state, { merge: true });
    } catch (e) {
      console.error("Failed to sync alerts to cloud", e);
    }
  }
};
