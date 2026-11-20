import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA4sZ2HQouNvQYf3r_ffA5f2MbTf-KG5fM",
  authDomain: "collab-platform-efeab.firebaseapp.com",
  projectId: "collab-platform-efeab",
  storageBucket: "collab-platform-efeab.firebasestorage.app",
  messagingSenderId: "372257196175",
  appId: "1:372257196175:web:fa4b06ae888220e69388fa",
  measurementId: "G-JPS6C3WVE1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
