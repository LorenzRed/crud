import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCUckjzyOTNUUqpDGV07gv1rGaCVSkHSf4",
  authDomain: "crud-6bad1.firebaseapp.com",
  projectId: "crud-6bad1",
  storageBucket: "crud-6bad1.firebasestorage.app",
  messagingSenderId: "908090647509",
  appId: "1:908090647509:web:33b8ef1b4ad809e869935c",
  measurementId: "G-4NXT9LJNXR"
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigError = missingConfig.length
  ? `Missing Firebase configuration: ${missingConfig.join(', ')}`
  : null;

let firestore: Firestore | null = null;

if (!firebaseConfigError) {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  firestore = getFirestore(app);
}

export const db = firestore;
