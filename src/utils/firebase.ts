// This is a compatibility layer between Firebase and Supabase
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { MigrantWorker } from '@/types/worker';
import { toast } from 'sonner';
import { generateWorkerId } from "./workerUtils";

// Firebase auth compatibility types
export const auth = {
  currentUser: null,
};

// Dummy RecaptchaVerifier for Firebase Auth compatibility
export class RecaptchaVerifier {
  constructor(_auth: any, containerId: string, _options: any) {
    if (!document.getElementById(containerId)) {
      const container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }
  }
  
  clear() {
    // No-op for compatibility
  }
  
  render() {
    return Promise.resolve('');
  }
}

// Get all workers from localStorage
export const getAllWorkersFromStorage = (): MigrantWorker[] => {
  const workersStr = localStorage.getItem('workers');
  return workersStr ? JSON.parse(workersStr) : [];
};

// Firebase-compatible functions for Supabase
export const registerWorkerInStorage = async (worker: {
  name: string;
  age: number;
  phone: string;
  originState: string;
  skill: string;
  aadhaar: string;
  email?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
}): Promise<MigrantWorker> => {
  try {
    const newWorker = {
      ...worker,
      id: generateWorkerId(),
      status: "active" as const,
      registrationDate: new Date().toISOString(),
    };

    // First save to localStorage in case Supabase fails
    const existingWorkers = getAllWorkersFromStorage();
    localStorage.setItem('workers', JSON.stringify([...existingWorkers, newWorker]));

    // Then try to save to Supabase
    const { data, error } = await supabase
      .from('workers')
      .insert([newWorker])
      .select();

    if (error) {
      console.error("Error inserting into Supabase:", error);
      return newWorker;
    }

    return data?.[0] as MigrantWorker || newWorker;
  } catch (error) {
    console.error("Error in registerWorkerInStorage:", error);
    throw error;
  }
};

export const updateWorkerStatus = async (workerId: string, status: string): Promise<void> => {
  try {
    // Update in localStorage first
    const workers = getAllWorkersFromStorage();
    const updatedWorkers = workers.map(worker => 
      worker.id === workerId ? { ...worker, status } : worker
    );
    localStorage.setItem('workers', JSON.stringify(updatedWorkers));

    // Then try Supabase update
    const { error } = await supabase
      .from('workers')
      .update({ status })
      .eq('id', workerId);

    if (error) {
      console.error("Error updating worker status in Supabase:", error);
    }
  } catch (error) {
    console.error("Error in updateWorkerStatus:", error);
    throw error;
  }
};

export const getAllWorkersRealtime = (callback: (workers: MigrantWorker[]) => void) => {
  // Initial fetch
  supabase
    .from('workers')
    .select('*')
    .then(({ data, error }) => {
      if (error) {
        console.error("Error fetching workers:", error);
        // Fall back to localStorage if Supabase fails
        const localWorkers = getAllWorkersFromStorage();
        callback(localWorkers);
        return;
      }
      
      if (data) {
        callback(data as MigrantWorker[]);
        // Also update localStorage
        localStorage.setItem('workers', JSON.stringify(data));
      }
    });

  // Set up real-time subscription
  const subscription = supabase
    .channel('workers-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'workers' 
    }, (payload) => {
      // When a change happens, fetch all workers again
      supabase
        .from('workers')
        .select('*')
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching workers after change:", error);
            return;
          }
          
          if (data) {
            callback(data as MigrantWorker[]);
            // Update localStorage
            localStorage.setItem('workers', JSON.stringify(data));
          }
        });
    })
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

// Mock phone authentication for demo purposes
export const signInWithPhoneNumber = async (phoneNumber: string) => {
  try {
    // For demo, we'll just add a delay to simulate the real process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if phone exists in workers
    const workers = getAllWorkersFromStorage();
    const worker = workers.find(w => w.phone === phoneNumber);
    
    if (!worker) {
      throw new Error("Phone number not registered. Please register first.");
    }
    
    // Return a mock verification ID (we'll use the phone number itself)
    return phoneNumber;
  } catch (error) {
    console.error("Error in signInWithPhoneNumber:", error);
    throw error;
  }
};

export const confirmOtp = async (verificationId: string, otp: string) => {
  try {
    // For demo, we'll accept any 6-digit OTP
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      throw new Error("Invalid OTP format. Must be 6 digits.");
    }
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, we would verify with Firebase/Supabase here
    // For demo, we'll just return the phone number (verification ID)
    return {
      user: {
        phoneNumber: verificationId
      }
    };
  } catch (error) {
    console.error("Error in confirmOtp:", error);
    throw error;
  }
};
