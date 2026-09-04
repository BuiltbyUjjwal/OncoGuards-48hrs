import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthState {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthAdapterResult {
  success: boolean;
  error?: string;
  user?: {
    name?: string;
    email: string;
    id: string;
  };
}

// Keeping the function name to avoid breaking imports in UI components
export const isClerkConfigured = (): boolean => {
  return true; 
};

export const executeEmailSignIn = async (credentials: SignInCredentials): Promise<AuthAdapterResult> => {
  const { email, password } = credentials;

  if (!email || !password) {
    return { success: false, error: 'Please enter both your email address and password.' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    return {
      success: true,
      user: {
        email: user.email || email,
        id: user.uid,
        name: user.displayName || undefined,
      },
    };
  } catch (error: any) {
    // Map common Firebase errors to user-friendly messages
    let msg = error.message;
    if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
    if (error.code === 'auth/user-not-found') msg = 'No account found with this email.';
    if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
    return { success: false, error: msg };
  }
};

export const executeEmailSignUp = async (credentials: SignUpCredentials): Promise<AuthAdapterResult> => {
  const { fullName, email, password } = credentials;

  if (!fullName || !email || !password) {
    return { success: false, error: 'Please fill in all required fields.' };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: fullName });

    return {
      success: true,
      user: {
        name: fullName,
        email: user.email || email,
        id: user.uid,
      },
    };
  } catch (error: any) {
    let msg = error.message;
    if (error.code === 'auth/email-already-in-use') msg = 'An account already exists with this email.';
    if (error.code === 'auth/weak-password') msg = 'Password is too weak. Please use at least 6 characters.';
    return { success: false, error: msg };
  }
};

export const executeGoogleOAuth = async (): Promise<AuthAdapterResult> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    return {
      success: true,
      user: {
        email: user.email || '',
        id: user.uid,
        name: user.displayName || undefined,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Google sign in failed' };
  }
};
