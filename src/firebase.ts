// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth,  GoogleAuthProvider } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACIguwDdNE3ZXQF_c3v2K3ceJXvirBKHk",
  authDomain: "lawbot-cc297.firebaseapp.com",
  projectId: "lawbot-cc297",
  storageBucket: "lawbot-cc297.firebasestorage.app",
  messagingSenderId: "385280886441",
  appId: "1:385280886441:web:b04ac5f000f39d85c98bb8",
  measurementId: "G-LPQRBGT1DF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();