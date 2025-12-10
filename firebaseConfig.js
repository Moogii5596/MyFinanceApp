// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// БИДЭНД ХЭРЭГТЭЙ МОДУЛИУД: Authentication, Firestore болон Storage
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// =========================================================================
// Таны Firebase Console-оос авсан бодит тохиргоо (СОЛИХ ШААРДЛАГГҮЙ)
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyByhAqvZNhOsVPW0tReYRr-B8qYDCvRaaQ",
  authDomain: "myfinanceapp-446ed.firebaseapp.com",
  projectId: "myfinanceapp-446ed",
  storageBucket: "myfinanceapp-446ed.firebasestorage.app",
  messagingSenderId: "164008239300",
  appId: "1:164008239300:web:cdd3c6455f2e2e8393a991",
  measurementId: "G-DLD0WXDF0M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// =========================================================================
// АПП-Д АШИГЛАХ МОДУЛИУДЫГ ЭКСПОРТЛОХ
// =========================================================================
export const AUTH = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});                                       // Firebase Authentication with AsyncStorage persistence
export const DB = getFirestore(app);      // Firestore Database (Гүйлгээ хадгалах)
export const STORAGE = getStorage(app);   // Firebase Storage (Зураг хадгалах)