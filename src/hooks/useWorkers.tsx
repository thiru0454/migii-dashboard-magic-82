
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MigrantWorker } from "@/types/worker";
import { 
  registerWorkerInStorage, 
  getAllWorkersFromStorage, 
  updateWorkerStatus,
  getAllWorkersRealtime
} from "@/utils/firebase";

export function useWorkers() {
  const queryClient = useQueryClient();
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  
  // Initialize workers from local storage
  useEffect(() => {
    const storedWorkers = getAllWorkersFromStorage();
    setWorkers(storedWorkers);
    setIsLoadingWorkers(false);
    
    // Set up real-time updates
    const unsubscribe = getAllWorkersRealtime((updatedWorkers) => {
      setWorkers(updatedWorkers);
      queryClient.setQueryData(["workers"], updatedWorkers);
    });
    
    return () => unsubscribe();
  }, [queryClient]);

  // Register worker mutation
  const registerWorker = useMutation({
    mutationFn: async (worker: {
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
    }) => {
      try {
        return await registerWorkerInStorage(worker);
      } catch (error: any) {
        console.error("Registration error in mutation:", error);
        throw new Error(error.message || "Failed to register worker");
      }
    },
    onSuccess: (worker) => {
      // Update local state
      setWorkers((prev) => [...prev, worker as MigrantWorker]);
      
      // Update React Query cache
      queryClient.setQueryData(["workers"], (oldData: MigrantWorker[] | undefined) => {
        return oldData ? [...oldData, worker as MigrantWorker] : [worker as MigrantWorker];
      });
    },
    onError: (error: Error) => {
      console.error("Worker registration error:", error);
      toast.error(error.message || "Failed to register worker");
    },
  });

  // Update worker mutation
  const updateWorker = useMutation({
    mutationFn: async (worker: MigrantWorker) => {
      try {
        await updateWorkerStatus(worker.id, worker.status);
        return worker;
      } catch (error: any) {
        console.error("Update worker error:", error);
        throw new Error(error.message || "Failed to update worker");
      }
    },
    onSuccess: (updatedWorker) => {
      // Update local state
      setWorkers((prev) => 
        prev.map(worker => 
          worker.id === updatedWorker.id ? updatedWorker : worker
        )
      );
      
      // Update React Query cache
      queryClient.setQueryData(["workers"], (oldData: MigrantWorker[] | undefined) => {
        if (!oldData) return [updatedWorker];
        return oldData.map(worker => 
          worker.id === updatedWorker.id ? updatedWorker : worker
        );
      });
      
      toast.success("Worker updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update worker");
    }
  });

  return {
    workers,
    isLoadingWorkers,
    registerWorker,
    updateWorker,
  };
}
