import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration - Your WhatsApp Chatbot SaaS project
const firebaseConfig = {
  apiKey: "AIzaSyBi78KSGWib0IwfB6AdVOjcFC4iXXiSAio",
  authDomain: "leadgenarator-dfe18.firebaseapp.com",
  projectId: "leadgenarator-dfe18",
  storageBucket: "leadgenarator-dfe18.firebasestorage.app",
  messagingSenderId: "33711033061",
  appId: "1:33711033061:web:af9153f118e1fa0a90620c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Note: Firebase emulators are disabled for production use
// To enable emulators, uncomment the code below and start Firebase emulators
/*
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    // Only connect to emulators if they're not already connected
    if (!auth._delegate._config?.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    if (!db._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    if (!storage._delegate._host?.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
    if (!functions._delegate._url?.includes('localhost')) {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
  } catch (error) {
    console.log('Firebase emulators already connected or not available');
  }
}
*/

export default app;
