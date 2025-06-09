import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MigrantWorker } from "@/types/worker";
import { getAllWorkers, subscribeToWorkers } from "@/utils/supabaseClient";
import { toast } from "sonner";

interface WorkersContextType {
  workers: MigrantWorker[];
  addWorker: (worker: MigrantWorker) => void;
  updateWorker: (workerId: string, updates: Partial<MigrantWorker>) => void;
  removeWorker: (workerId: string) => void;
  isLoading: boolean;
}

const WorkersContext = createContext<WorkersContextType | undefined>(undefined);

export function WorkersProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial workers data
  useEffect(() => {
    console.log("WorkersContext: Initial fetch starting...");
    let unsubscribeFunc: (() => void) | undefined;

    const fetchWorkers = async () => {
      try {
        setIsLoading(true);
        
        // Check if environment variables are available
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.error("Missing Supabase environment variables");
          toast.error("Database configuration error. Please check environment variables.");
          setIsLoading(false);
          return;
        }

        console.log("Fetching workers from Supabase...");
        const result = await getAllWorkers();
        
        console.log("WorkersContext: Fetch result:", result);
        
        if (result.error) {
          console.error("Error fetching workers:", result.error);
          
          // Provide more specific error messages
          if (result.error.message?.includes('Failed to fetch')) {
            toast.error("Unable to connect to the database. Please check your internet connection.");
          } else if (result.error.message?.includes('JWT')) {
            toast.error("Authentication error. Please refresh the page.");
          } else {
            toast.error("Failed to fetch workers. Please try again later.");
          }
          return;
        }

        if (!result.data) {
          console.warn("No data received from workers fetch");
          setWorkers([]);
          return;
        }

        // Ensure all worker IDs are strings and map database fields to component fields
        const formattedWorkers = result.data.map(worker => ({
          ...worker,
          id: String(worker.id),
          skill: worker.primary_skill || worker.skill,
          originState: worker.origin_state || worker.originState
        }));

        console.log("Setting workers:", formattedWorkers);
        setWorkers(formattedWorkers);
        
        // Store in localStorage as backup
        try {
          localStorage.setItem('workers', JSON.stringify(formattedWorkers));
        } catch (storageError) {
          console.warn("Could not save to localStorage:", storageError);
        }
        
      } catch (err) {
        console.error("Error in fetchWorkers:", err);
        
        // Provide more specific error messages based on the error type
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          toast.error("Network error. Please check your internet connection and try again.");
        } else if (err instanceof Error && err.message === 'Request timeout') {
          toast.error("Request timed out. Please try again.");
        } else {
          toast.error("Failed to fetch workers. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkers();

    // Set up real-time subscription
    try {
      const subscription = subscribeToWorkers(() => {
        console.log("WorkersContext: Subscription triggered, fetching updates...");
        fetchWorkers();
      });
      
      if (subscription) {
        unsubscribeFunc = () => {
          subscription.unsubscribe();
        };
      }
    } catch (subscriptionError) {
      console.error("Error setting up subscription:", subscriptionError);
    }

    return () => {
      if (unsubscribeFunc) {
        unsubscribeFunc();
      }
    };
  }, []);

  const addWorker = (worker: MigrantWorker) => {
    console.log("WorkersContext: Adding worker:", worker);
    setWorkers(prev => {
      const updated = [...prev, worker];
      // Update localStorage
      try {
        localStorage.setItem('workers', JSON.stringify(updated));
      } catch (error) {
        console.warn("Could not update localStorage:", error);
      }
      return updated;
    });
  };

  const updateWorker = (workerId: string, updates: Partial<MigrantWorker>) => {
    console.log("WorkersContext: Updating worker:", { workerId, updates });
    setWorkers(prev => {
      const updated = prev.map(worker =>
        worker.id === workerId
          ? { ...worker, ...updates }
          : worker
      );
      // Update localStorage
      try {
        localStorage.setItem('workers', JSON.stringify(updated));
      } catch (error) {
        console.warn("Could not update localStorage:", error);
      }
      return updated;
    });
  };

  const removeWorker = (workerId: string) => {
    console.log("WorkersContext: Removing worker:", workerId);
    setWorkers(prev => {
      const updated = prev.filter(worker => worker.id !== workerId);
      // Update localStorage
      try {
        localStorage.setItem('workers', JSON.stringify(updated));
      } catch (error) {
        console.warn("Could not update localStorage:", error);
      }
      return updated;
    });
  };

  const value = {
    workers,
    addWorker,
    updateWorker,
    removeWorker,
    isLoading
  };

  return (
    <WorkersContext.Provider value={value}>
      {children}
    </WorkersContext.Provider>
  );
}

export function useWorkersContext() {
  const context = useContext(WorkersContext);
  if (context === undefined) {
    throw new Error("useWorkersContext must be used within a WorkersProvider");
  }
  return context;
}