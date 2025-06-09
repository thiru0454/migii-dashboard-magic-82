// This is a compatibility layer between Firebase and Supabase
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { MigrantWorker, Worker } from '@/types/worker';
import { toast } from 'sonner';
import { generateWorkerId } from "./workerUtils";
import { getAllWorkers } from './supabaseClient';
import { verifyOtp } from './emailService';

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
  try {
    const workersStr = localStorage.getItem('workers');
    return workersStr ? JSON.parse(workersStr) : [];
  } catch (error) {
    console.error("Error parsing workers from localStorage:", error);
    return [];
  }
};

// Find worker by email
export const findWorkerByEmail = async (email: string): Promise<MigrantWorker | null> => {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .or(`email.eq.${email},email.eq.${email.toLowerCase()},email.eq.${email.toUpperCase()},email.ilike.${email}`)
      .single();
    
    if (error || !data) {
      console.log("Email not found in Supabase, checking localStorage");
      // Fall back to localStorage
      const workers = getAllWorkersFromStorage();
      return workers.find(w => 
        w.email?.toLowerCase() === email.toLowerCase() || 
        w["Email Address"]?.toLowerCase() === email.toLowerCase()
      ) || null;
    }
    
    return data as MigrantWorker;
  } catch (error) {
    console.error("Error finding worker by email:", error);
    // Fall back to localStorage
    const workers = getAllWorkersFromStorage();
    return workers.find(w => 
      w.email?.toLowerCase() === email.toLowerCase() || 
      w["Email Address"]?.toLowerCase() === email.toLowerCase()
    ) || null;
  }
};

// Find worker by phone
export const findWorkerByPhone = async (phone: string): Promise<MigrantWorker | null> => {
  try {
    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .or(`phone.eq.${phone},phone.ilike.${phone}`)
      .single();
    
    if (error || !data) {
      console.log("Phone not found in Supabase, checking localStorage");
      // Fall back to localStorage
      const workers = getAllWorkersFromStorage();
      return workers.find(w => 
        w.phone === phone || 
        w["Phone Number"] === phone
      ) || null;
    }
    
    return data as MigrantWorker;
  } catch (error) {
    console.error("Error finding worker by phone:", error);
    // Fall back to localStorage
    const workers = getAllWorkersFromStorage();
    return workers.find(w => 
      w.phone === phone || 
      w["Phone Number"] === phone
    ) || null;
  }
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
    const workerId = generateWorkerId();
    
    // Create worker object with all required fields for MigrantWorker type
    const newWorker: MigrantWorker = {
      id: workerId,
      name: worker.name,
      "Full Name": worker.name,
      age: worker.age,
      "Age": worker.age,
      phone: worker.phone,
      "Phone Number": worker.phone,
      email: worker.email || "",
      "Email Address": worker.email || "",
      skill: worker.skill,
      primarySkill: worker.skill,
      "Primary Skill": worker.skill,
      originState: worker.originState,
      "Origin State": worker.originState,
      status: "active",
      registrationDate: new Date().toISOString(),
      photoUrl: worker.photoUrl,
      "Photo URL": worker.photoUrl,
      latitude: worker.latitude,
      longitude: worker.longitude,
      aadhaar: worker.aadhaar,
      "Aadhaar Number": worker.aadhaar
    };

    // First save to localStorage in case Supabase fails
    const existingWorkers = getAllWorkersFromStorage();
    localStorage.setItem('workers', JSON.stringify([...existingWorkers, newWorker]));

    // Then try to save to Supabase
    try {
      const { data, error } = await supabase
        .from('workers')
        .insert([newWorker])
        .select();

      if (error) {
        console.error("Error inserting into Supabase:", error);
        return newWorker;
      }

      return data?.[0] as MigrantWorker || newWorker;
    } catch (supabaseError) {
      console.error("Error inserting into Supabase:", supabaseError);
      return newWorker;
    }
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
    try {
      const { error } = await supabase
        .from('workers')
        .update({ status })
        .eq('id', workerId);

      if (error) {
        console.error("Error updating worker status in Supabase:", error);
      }
    } catch (supabaseError) {
      console.error("Error updating worker status in Supabase:", supabaseError);
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
  try {
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
  } catch (error) {
    console.error("Error setting up real-time subscription:", error);
    // Return a dummy unsubscribe function
    return () => {};
  }
};

// Phone authentication for real OTP
export const signInWithPhoneNumber = async (phoneNumber: string) => {
  try {
    // For demo, we'll just add a delay to simulate the real process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if phone exists in workers
    const workers = getAllWorkersFromStorage();
    const worker = workers.find(w => w.phone === phoneNumber || w["Phone Number"] === phoneNumber);
    
    if (!worker) {
      // Try to check in Supabase
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .or(`phone.eq.${phoneNumber},phone.ilike.${phoneNumber}`)
        .single();
        
      if (error || !data) {
        throw new Error("Phone number not registered. Please register first.");
      }
    }
    
    // Return a verification ID (we'll use the phone number itself)
    return phoneNumber;
  } catch (error) {
    console.error("Error in signInWithPhoneNumber:", error);
    throw error;
  }
};

export const confirmOtp = (verificationId: string, otp: string) => {
  try {
    // Verify OTP using the emailService function
    return verifyOtp(verificationId, otp);
  } catch (error) {
    console.error("Error in confirmOtp:", error);
    return false;
  }
};

// Fetch a worker by phone or email from Supabase using correct field names
export const getWorkerByContact = async (contact: string): Promise<MigrantWorker | null> => {
  try {
    const { data, error } = await getAllWorkers();
    if (error || !data) {
      // Try localStorage
      const workers = getAllWorkersFromStorage();
      const trimmedContact = contact.trim();
      return (
        workers.find(
          (w) =>
            w["Phone Number"] === trimmedContact ||
            w["Email Address"] === trimmedContact ||
            w.phone === trimmedContact ||
            w.email === trimmedContact
        ) || null
      );
    }
    const trimmedContact = contact.trim();
    return (
      data.find(
        (w: any) =>
          w["Phone Number"] === trimmedContact ||
          w["Email Address"] === trimmedContact ||
          w.phone === trimmedContact ||
          w.email === trimmedContact
      ) || null
    );
  } catch (error) {
    console.error("Error in getWorkerByContact:", error);
    // Try localStorage as fallback
    const workers = getAllWorkersFromStorage();
    const trimmedContact = contact.trim();
    return (
      workers.find(
        (w) =>
          w["Phone Number"] === trimmedContact ||
          w["Email Address"] === trimmedContact ||
          w.phone === trimmedContact ||
          w.email === trimmedContact
      ) || null
    );
  }
};

// Fetch a single worker directly from Supabase by phone or email
export const getWorkerDirectFromSupabase = async (contact: string): Promise<MigrantWorker | null> => {
  try {
    const trimmedContact = contact.trim();
    console.log('[Worker Fetch] Searching for contact:', trimmedContact);
    
    // Try by phone number first
    let { data, error } = await supabase
      .from('workers')
      .select('*')
      .or(`phone.eq.${trimmedContact},phone.ilike.${trimmedContact}`)
      .single();
      
    console.log('[Worker Fetch] By Phone Number:', { data, error });
    
    if (error || !data) {
      // Try by email if not found by phone
      ({ data, error } = await supabase
        .from('workers')
        .select('*')
        .or(`email.eq.${trimmedContact},email.ilike.${trimmedContact}`)
        .single());
        
      console.log('[Worker Fetch] By Email Address:', { data, error });
      
      if (error || !data) {
        // Try localStorage as fallback
        const workers = getAllWorkersFromStorage();
        const worker = workers.find(
          (w) =>
            w["Phone Number"] === trimmedContact ||
            w["Email Address"] === trimmedContact ||
            w.phone === trimmedContact ||
            w.email === trimmedContact
        );
        
        return worker || null;
      }
    }
    
    return data as MigrantWorker;
  } catch (error) {
    console.error('Error in getWorkerDirectFromSupabase:', error);
    // Try localStorage as fallback
    const workers = getAllWorkersFromStorage();
    const trimmedContact = contact.trim();
    return (
      workers.find(
        (w) =>
          w["Phone Number"] === trimmedContact ||
          w["Email Address"] === trimmedContact ||
          w.phone === trimmedContact ||
          w.email === trimmedContact
      ) || null
    );
  }
};