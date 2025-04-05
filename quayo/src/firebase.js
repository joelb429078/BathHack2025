import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCM0GQvvBGyhreAqV0TjZsHgIPt6SVl4lc",
  authDomain: "oursystem2.firebaseapp.com",
  projectId: "oursystem2",
  storageBucket: "oursystem2.firebasestorage.app",
  messagingSenderId: "1064479673039",
  appId: "1:1064479673039:web:95f871432bfea5a903c5ba",
  measurementId: "G-9VPY9YG60B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };