// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAN20qV_rZbomBZDRWbCTvN7pEQWvL7SxY",
  authDomain: "fir-database-92cb5.firebaseapp.com",
  projectId: "fir-database-92cb5",
  storageBucket: "fir-database-92cb5.firebasestorage.app",
  messagingSenderId: "878313621640",
  appId: "1:878313621640:web:7d02315c8fb9a3c1c1b73d",
  measurementId: "G-6GQDHRK1NS"
};

// Initialize Firebase

export const  firebase_app = initializeApp(firebaseConfig);

export const  firebase_auth = getAuth(firebase_app);

