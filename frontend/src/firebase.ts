import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBUw-wWwidO9q-z35O0Z8ddcjBcMGtsMs8",
  authDomain: "kbc-digital-adboard.firebaseapp.com",
  databaseURL: "https://kbc-digital-adboard-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kbc-digital-adboard",
  storageBucket: "kbc-digital-adboard.firebasestorage.app",
  messagingSenderId: "401539152997",
  appId: "1:401539152997:web:cfb83b7e75a43847fe9a8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 THIS is what your Login uses
export const auth = getAuth(app);