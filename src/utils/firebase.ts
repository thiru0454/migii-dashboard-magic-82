
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, PhoneAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

// Initialize reCAPTCHA verifier
export const initRecaptcha = (buttonId: string) => {
  return new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
  });
};

// Local storage solution for worker data
const WORKERS_STORAGE_KEY = 'migii_workers';

// Get all workers from local storage
export const getAllWorkersFromStorage = (): any[] => {
  const workersData = localStorage.getItem(WORKERS_STORAGE_KEY);
  return workersData ? JSON.parse(workersData) : [];
};

// Register a worker using local storage
export const registerWorkerInStorage = async (
  worker: Omit<any, "id" | "status" | "registrationDate">
): Promise<any> => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Generate a worker ID
    const randomSuffix = Math.floor(10000 + Math.random() * 90000).toString();
    const workerId = `TN-MIG-${dateStr}-${randomSuffix}`;
    
    // Create the complete worker object
    const completeWorker = {
      ...worker,
      id: workerId,
      status: "active",
      registrationDate: `${month}/${day}/${year}`,
    };

    // Get current workers array
    const workers = getAllWorkersFromStorage();
    
    // Add new worker
    workers.push(completeWorker);
    
    // Save back to storage
    localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(workers));

    console.log("Worker registered:", completeWorker);
    
    return completeWorker;
  } catch (error) {
    console.error("Error registering worker:", error);
    throw new Error("Failed to register worker. Please try again.");
  }
};

// Update worker status in local storage
export const updateWorkerStatus = async (workerId: string, status: string) => {
  try {
    const workers = getAllWorkersFromStorage();
    const updatedWorkers = workers.map(worker => {
      if (worker.id === workerId) {
        return { ...worker, status };
      }
      return worker;
    });
    
    localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(updatedWorkers));
    return true;
  } catch (error) {
    console.error("Error updating worker status:", error);
    throw new Error("Failed to update worker status. Please try again.");
  }
};

// Get all workers with a callback for real-time updates (simulated)
export const getAllWorkersRealtime = (callback: (workers: any[]) => void) => {
  // Initial call with current data
  callback(getAllWorkersFromStorage());
  
  // Set up storage event listener to detect changes
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === WORKERS_STORAGE_KEY) {
      callback(getAllWorkersFromStorage());
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => window.removeEventListener('storage', handleStorageChange);
};

export default app;
