// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKYw_t-S1AozcAZMK2W5Ds2LS8B2aaws",
  authDomain: "recipeata-app.firebaseapp.com",
  projectId: "recipeata-app",
  storageBucket: "recipeata-app.appspot.com",
  messagingSenderId: "885341032453",
  appId: "1:885341032453:web:f07d268bdc51006bb44c6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them for use in other parts of the app
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);