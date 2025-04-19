
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBj08OqMntL5m24BhPsnP1KYWc52TPjTP4",
  authDomain: "migii-login.firebaseapp.com",
  projectId: "migii-login",
  storageBucket: "migii-login.firebasestorage.app",
  messagingSenderId: "153772267209",
  appId: "1:153772267209:web:4bcb9fc65f97308f5a5f18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize reCAPTCHA verifier
export const initRecaptcha = (buttonId: string, callback: () => void) => {
  return new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {
      callback();
    },
  });
};

export default app;
