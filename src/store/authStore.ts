import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  _setUser: (user: User | null) => void;
}

export function toAuthUser(user: User): AuthUser {
  const googleProfile = user.providerData?.find(
    (profile) => profile.providerId === 'google.com'
  );

  return {
    uid: user.uid,
    displayName: user.displayName ?? googleProfile?.displayName ?? null,
    email: user.email ?? googleProfile?.email ?? null,
    photoURL: googleProfile?.photoURL ?? user.photoURL ?? null,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: isFirebaseConfigured ? 'loading' : 'signed-out',
  error: null,

  signInWithGoogle: async () => {
    if (!isFirebaseConfigured) {
      set({ error: 'Firebase is not configured.' });
      return;
    }
    const auth = getFirebaseAuth();
    set({ error: null });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          set({ error: (redirectErr as Error).message });
          return;
        }
      }
      set({ error: (err as Error).message });
    }
  },

  signOutUser: async () => {
    if (!isFirebaseConfigured) return;
    await signOut(getFirebaseAuth());
  },

  _setUser: (user) =>
    set({
      user: user ? toAuthUser(user) : null,
      status: user ? 'signed-in' : 'signed-out',
    }),
}));

export function initAuthListener(): () => void {
  if (!isFirebaseConfigured) {
    useAuthStore.setState({ status: 'signed-out' });
    return () => {};
  }
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => {
    useAuthStore.getState()._setUser(user);
  });
}
