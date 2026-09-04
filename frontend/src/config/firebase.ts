import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCy9aXffuIXMBSxpWb0tYP3AARanJ79pqM",
  authDomain: "oncoguards.firebaseapp.com",
  projectId: "oncoguards",
  storageBucket: "oncoguards.firebasestorage.app",
  messagingSenderId: "715631726130",
  appId: "1:715631726130:web:a8a89f2ae4ad4e2c2ff62b",
  measurementId: "G-7X6CFE667M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Explicitly set local persistence so sessions survive refresh
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});

export default app;
