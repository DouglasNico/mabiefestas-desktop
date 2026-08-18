/**
 * firebase-config.js - Configuração Oficial do Firebase para o Aplicativo Desktop Mabie Festas
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
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
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// Configurar persistência local para manter o usuário logado
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Aviso na persistência do Firebase Auth:", err);
});

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
