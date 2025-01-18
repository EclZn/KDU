// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";


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
//3efebd88-04a7-45f7-86c6-3a77be735726 OneSignal app-Id
export const  firebase_app = initializeApp(firebaseConfig);

export const  firebase_auth = initializeAuth(firebase_app, {persistence : getReactNativePersistence(ReactNativeAsyncStorage)});

