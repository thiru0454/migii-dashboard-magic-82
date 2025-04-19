
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, PhoneAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase, ref, set, get, child, push, update } from "firebase/database";
import { MigrantWorker } from "@/types/worker";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBj08OqMntL5m24BhPsnP1KYWc52TPjTP4",
  authDomain: "migii-login.firebaseapp.com",
  projectId: "migii-login",
  storageBucket: "migii-login.firebasestorage.app",
  messagingSenderId: "153772267209",
  appId: "1:153772267209:web:4bcb9fc65f97308f5a5f18",
  databaseURL: "https://migii-login-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

// Initialize reCAPTCHA verifier
export const initRecaptcha = (buttonId: string) => {
  return new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
  });
};

// Worker database functions
export const registerWorkerInDB = async (worker: Omit<MigrantWorker, "id" | "status" | "registrationDate">) => {
  // Generate a reference key first for better performance
  const newWorkerRef = push(ref(database, 'workers'));
  const workerId = newWorkerRef.key;
  
  // Use simpler date format generation (faster than toISOString)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Create worker data with optimized structure
  const workerData: MigrantWorker = {
    ...worker,
    id: `TN-MIG-${dateStr}-${workerId?.slice(-5)}`,
    status: "active",
    registrationDate: `${month}/${day}/${year}`, // Simplified date format
  };

  // Set the data and return immediately
  set(newWorkerRef, workerData); // Don't await - fire and forget
  
  return workerData; // Return immediately to speed up the process
};

export const updateWorkerStatus = async (workerId: string, status: string) => {
  const updates = {
    [`/workers/${workerId}/status`]: status,
  };
  await update(ref(database), updates);
};

export const getAllWorkers = async () => {
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, 'workers'));
  if (snapshot.exists()) {
    return Object.values(snapshot.val());
  }
  return [];
};

export default app;
