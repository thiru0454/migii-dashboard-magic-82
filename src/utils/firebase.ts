
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, PhoneAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, onSnapshot, updateDoc, serverTimestamp, query } from "firebase/firestore";
import { MigrantWorker } from "@/types/worker";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBj08OqMntL5m24BhPsnP1KYWc52TPjTP4",
  authDomain: "migii-login.firebaseapp.com",
  projectId: "migii-login",
  storageBucket: "migii-login.appspot.com",
  messagingSenderId: "153772267209",
  appId: "1:153772267209:web:4bcb9fc65f97308f5a5f18",
  databaseURL: "https://migii-login-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);

// Initialize reCAPTCHA verifier
export const initRecaptcha = (buttonId: string) => {
  return new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
  });
};

// Register a worker in Firestore
export const registerWorkerInDB = async (
  worker: Omit<MigrantWorker, "id" | "status" | "registrationDate">
): Promise<MigrantWorker> => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Generate a worker ID without depending on Firestore doc ID first
    const randomSuffix = Math.floor(10000 + Math.random() * 90000).toString();
    const workerId = `TN-MIG-${dateStr}-${randomSuffix}`;
    
    // Insert directly with the generated ID
    await setDoc(doc(firestore, "workers", workerId), {
      ...worker,
      id: workerId,
      status: "active",
      registrationDate: `${month}/${day}/${year}`,
      createdAt: serverTimestamp(),
    });

    // Also create worker_details mirror
    await setDoc(doc(firestore, "worker_details", workerId), {
      id: workerId,
      name: worker.name,
      phone: worker.phone,
      aadhaar: worker.aadhaar,
      status: "active",
      registrationDate: `${month}/${day}/${year}`,
      createdAt: serverTimestamp(),
    });

    return {
      ...worker,
      id: workerId,
      status: "active",
      registrationDate: `${month}/${day}/${year}`,
    };
  } catch (error) {
    console.error("Error registering worker:", error);
    throw new Error("Failed to register worker. Please try again.");
  }
};

export const updateWorkerStatus = async (workerId: string, status: string) => {
  try {
    // Update directly using workerId as document ID
    await updateDoc(doc(firestore, "workers", workerId), { status });
    // Also update worker_details
    await updateDoc(doc(firestore, "worker_details", workerId), { status });
  } catch (error) {
    console.error("Error updating worker status:", error);
    throw new Error("Failed to update worker status. Please try again.");
  }
};

export const getAllWorkersRealtime = (callback: (workers: MigrantWorker[]) => void) => {
  const workersColl = collection(firestore, "workers");
  return onSnapshot(workersColl, (snapshot) => {
    const workers: MigrantWorker[] = [];
    snapshot.forEach((doc) => {
      workers.push(doc.data() as MigrantWorker);
    });
    callback(workers);
  }, (error) => {
    console.error("Error getting workers:", error);
  });
};

export default app;
