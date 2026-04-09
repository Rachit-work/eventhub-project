import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 1. Added this import
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB5xrqhqlYYTOPe3SIT8M5zxRILVIoiVpI",
  authDomain: "eventhub-72dce.firebaseapp.com",
  projectId: "eventhub-72dce",
  storageBucket: "eventhub-72dce.firebasestorage.app",
  messagingSenderId: "326726893056",
  appId: "1:326726893056:web:61ef87cf3bb3e9087962e5",
  measurementId: "G-T0FB0FNYXB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. Initialize and EXPORT the Auth service
export const auth = getAuth(app);