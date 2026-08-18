/**
 * firebase-config.js - Configuração Oficial do Firebase para o Aplicativo Desktop Mabie Festas
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJR1CgHU9vXgDkJWdOGKx0-_UhW9GMI5E",
  authDomain: "mabie-site.firebaseapp.com",
  projectId: "mabie-site",
  storageBucket: "mabie-site.firebasestorage.app",
  messagingSenderId: "269079935692",
  appId: "1:269079935692:web:efeacaa5633372fdbbe069",
  measurementId: "G-YFSX6G28MM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Aviso na persistência do Firebase Auth:", err);
  });
} catch (e) {
  // fallback
}

export { 
  app, 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
};
