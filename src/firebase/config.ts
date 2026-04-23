import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Initialize Cloud Storage and configure it to fail fast (3s timeout) to prevent infinite UI hanging
// if the storage bucket hasn't been fully provisioned in the Firebase Console yet.
export const storage = getStorage(app);
storage.maxUploadRetryTime = 3000;
storage.maxOperationRetryTime = 3000;
