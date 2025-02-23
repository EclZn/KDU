// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

import { FIREBASE_DATABASE_URL ,FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN,FIREBASE_APP_ID,FIREBASE_MEASUREMENT_ID,FIREBASE_MESSAGING_SENDER_ID,
         FIREBASE_PROJECT_ID,FIREBASE_STORAGE_BUCKET, FIREBASE_STORAGE_URL} from '@env' ;


const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
  databaseURL: FIREBASE_DATABASE_URL
};

// Initialize Firebase
//3efebd88-04a7-45f7-86c6-3a77be735726 OneSignal app-Id
export const  firebase_app = initializeApp(firebaseConfig);

export const  firebase_auth = initializeAuth(firebase_app, {persistence : getReactNativePersistence(ReactNativeAsyncStorage)});

export const db = getDatabase(firebase_app);

export const firebase_storage = getStorage(firebase_app, `gs://${FIREBASE_STORAGE_URL}`);
