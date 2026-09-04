import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  user?: User;
}

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signupWithEmail: (email: string, password: string, fullName: string) => Promise<AuthActionResult>;
  loginWithGoogle: () => Promise<AuthActionResult>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const mapAuthError = (error: any): string => {
  const code = error?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists with this email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters long.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a few moments and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled before completion.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Only one sign-in popup is allowed at a time.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  return error?.message || 'Authentication failed. Please try again.';
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  loginWithEmail: async () => ({ success: false }),
  signupWithEmail: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  sendPasswordReset: async () => ({ success: false }),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error) };
    }
  };

  const signupWithEmail = async (email: string, password: string, fullName: string): Promise<AuthActionResult> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (fullName.trim()) {
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
      }
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error) };
    }
  };

  const loginWithGoogle = async (): Promise<AuthActionResult> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error) };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error) };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

