
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
  const newWorkerRef = push(ref(database, 'workers'));
  const workerId = newWorkerRef.key;
  
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const workerData = {
    ...worker,
    id: `TN-MIG-${dateStr}-${workerId?.slice(-5)}`,
    status: "active",
    registrationDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  };

  await set(newWorkerRef, workerData);
  return workerData;
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
