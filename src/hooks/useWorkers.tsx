
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MigrantWorker } from "@/types/worker";
import { getAllWorkers, subscribeToWorkers } from "@/utils/supabaseClient";

export function useWorkers() {
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
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
          setWorkers([]);
          setError(error.message);
        } else {
          console.log("Workers fetched successfully:", data);
          // Ensure all worker IDs are strings
          const formattedWorkers = data?.map(worker => ({
            ...worker,
            id: String(worker.id)
          })) || [];
          setWorkers(formattedWorkers);
          setError(null);
        }
        setIsLoadingWorkers(false);
      });

    // Real-time subscription
    const subscription = subscribeToWorkers(() => {
      console.log("Worker subscription triggered, fetching updated data...");
      getAllWorkers()
        .then(({ data, error }) => {
          if (!error) {
            // Ensure all worker IDs are strings
            const formattedWorkers = data?.map(worker => ({
              ...worker,
              id: String(worker.id)
            })) || [];
            setWorkers(formattedWorkers);
          } else {
            console.error("Error in subscription update:", error);
          }
        });
    });
    
    unsubscribeFunc = () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };

    return () => {
      if (unsubscribeFunc) unsubscribeFunc();
    };
  }, []);

  // Function to assign a worker to a business
  const assignWorker = async (workerId: string, businessId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/workers/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workerId, businessId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign worker');
      }
      
      // Update local state
      setWorkers(prev => 
        prev.map(worker => 
          worker.id === workerId 
            ? { ...worker, assignedBusinessId: businessId }
            : worker
        )
      );
      
      toast.success("Worker assigned successfully");
      return true;
    } catch (error) {
      console.error("Error assigning worker:", error);
      toast.error("Failed to assign worker");
      return false;
    }
  };

  return {
    workers,
    isLoadingWorkers,
    error,
    assignWorker,
  };
}
