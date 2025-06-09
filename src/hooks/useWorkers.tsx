import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MigrantWorker } from "@/types/worker";
import { getAllWorkers, subscribeToWorkers, assignWorkerToBusiness } from "@/utils/supabaseClient";

export function useWorkers() {
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeFunc: (() => void) | undefined;
    setIsLoadingWorkers(true);
    
    // Initial fetch from Supabase
    getAllWorkers()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to fetch workers:", error);
          toast.error("Failed to fetch workers from Supabase");
          
          // Try to load from localStorage as fallback
          const storedWorkers = localStorage.getItem('workers');
          if (storedWorkers) {
            try {
              const parsedWorkers = JSON.parse(storedWorkers);
              setWorkers(parsedWorkers);
              setError(null);
            } catch (parseError) {
              console.error("Error parsing workers from localStorage:", parseError);
              setWorkers([]);
              setError("Failed to load workers from storage");
            }
          } else {
            setWorkers([]);
            setError(error.message);
          }
        } else {
          console.log("Workers fetched successfully:", data);
          // Ensure all worker IDs are strings
          const formattedWorkers = data?.map(worker => ({
            ...worker,
            id: String(worker.id)
          })) || [];
          setWorkers(formattedWorkers);
          setError(null);
          
          // Also update localStorage for redundancy
          try {
            localStorage.setItem('workers', JSON.stringify(formattedWorkers));
          } catch (storageError) {
            console.error("Error storing workers in localStorage:", storageError);
          }
        }
        setIsLoadingWorkers(false);
      })
      .catch(err => {
        console.error("Exception during worker fetch:", err);
        setIsLoadingWorkers(false);
        setError("Failed to fetch workers");
        
        // Try to load from localStorage as fallback
        const storedWorkers = localStorage.getItem('workers');
        if (storedWorkers) {
          try {
            const parsedWorkers = JSON.parse(storedWorkers);
            setWorkers(parsedWorkers);
          } catch (parseError) {
            console.error("Error parsing workers from localStorage:", parseError);
            setWorkers([]);
          }
        } else {
          setWorkers([]);
        }
      });

    // Real-time subscription
    try {
      const subscription = subscribeToWorkers(() => {
        console.log("Worker subscription triggered, fetching updated data...");
        getAllWorkers()
          .then(({ data, error }) => {
            if (!error && data) {
              // Ensure all worker IDs are strings
              const formattedWorkers = data.map(worker => ({
                ...worker,
                id: String(worker.id)
              }));
              setWorkers(formattedWorkers);
              
              // Update localStorage
              try {
                localStorage.setItem('workers', JSON.stringify(formattedWorkers));
              } catch (storageError) {
                console.error("Error storing workers in localStorage:", storageError);
              }
            } else {
              console.error("Error in subscription update:", error);
            }
          })
          .catch(err => {
            console.error("Exception during subscription update:", err);
          });
      });
      
      unsubscribeFunc = () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    } catch (subscriptionError) {
      console.error("Error setting up worker subscription:", subscriptionError);
    }

    return () => {
      if (unsubscribeFunc) unsubscribeFunc();
    };
  }, []);

  // Function to assign a worker to a business with improved error handling and notification
  const assignWorker = async (workerId: string, businessId: string) => {
    setIsAssigning(true);
    try {
      console.log(`Assigning worker ${workerId} to business ${businessId}`);
      
      // Use our enhanced service function
      const { data, error } = await assignWorkerToBusiness(workerId, businessId);
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error("Failed to assign worker - no data returned");
      }
      
      // Update local state
      setWorkers(prev => 
        prev.map(worker => 
          worker.id === workerId 
            ? { ...worker, assignedBusinessId: businessId }
            : worker
        )
      );
      
      // Also update localStorage
      try {
        const storedWorkers = localStorage.getItem('workers');
        if (storedWorkers) {
          const parsedWorkers = JSON.parse(storedWorkers);
          const updatedWorkers = parsedWorkers.map((worker: MigrantWorker) => 
            worker.id === workerId 
              ? { ...worker, assignedBusinessId: businessId }
              : worker
          );
          localStorage.setItem('workers', JSON.stringify(updatedWorkers));
        }
      } catch (storageError) {
        console.error("Error updating worker in localStorage:", storageError);
      }
      
      toast.success("Worker assigned successfully. Worker notification sent for approval.");
      setIsAssigning(false);
      return true;
    } catch (error: any) {
      console.error("Error assigning worker:", error);
      toast.error(error.message || "Failed to assign worker");
      setIsAssigning(false);
      return false;
    }
  };

  return {
    workers,
    isLoadingWorkers,
    isAssigning,
    error,
    assignWorker,
  };
}