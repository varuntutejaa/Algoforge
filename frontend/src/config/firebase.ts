import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAAkGnGLCua8K_1CPyEOuos9jLuM8KNqFk',
  authDomain: 'algoforge-d0e7e.firebaseapp.com',
  projectId: 'algoforge-d0e7e',
  storageBucket: 'algoforge-d0e7e.firebasestorage.app',
  messagingSenderId: '705454689701',
  appId: '1:705454689701:web:feb912b1a5edc709be2c4c',
  measurementId: 'G-D9XM5V7ZRM',
};

// Avoid re-initialising when hot-reloaded in dev
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
