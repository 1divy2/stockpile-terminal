import { create } from "zustand";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => {
  // Listen for auth state changes immediately upon store creation
  onAuthStateChanged(auth, (user) => {
    set({ user, loading: false, initialized: true });
  });

  return {
    user: null,
    loading: true,
    initialized: false,
    logout: async () => {
      try {
        await signOut(auth);
        set({ user: null });
      } catch (error) {
        console.error("Logout failed", error);
      }
    },
  };
});
