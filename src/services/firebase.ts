/**
 * Camada de Conexão com Firebase (Firestore + Authentication)
 * MIX GESTÃO — Mix Variedades Store
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Configuração obtida por variáveis de ambiente ou credenciais
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-mix-gestao-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mix-gestao.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mix-gestao-prod',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mix-gestao.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

// Indica se o Firebase real está configurado com credenciais válidas
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase inicializado em modo simulado/local:', error);
}

export { app, auth, db };
