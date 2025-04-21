
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { MigrantWorker } from "@/types/worker";
import { 
  registerWorkerInDB, 
  getAllWorkersRealtime, 
  updateWorkerStatus 
} from "@/utils/firebase";

export function useWorkers() {
  const queryClient = useQueryClient();
  
  // Use a query that triggers a local store update whenever Firestore changes (real-time)
  const { data: workers = [], isLoading: isLoadingWorkers } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => [],
    staleTime: Infinity, // We'll update it ourselves
  });

  // Real-time data using Firestore onSnapshot
  useEffect(() => {
    const unsubscribe = getAllWorkersRealtime((workers) => {
      queryClient.setQueryData(["workers"], workers);
    });
    return () => unsubscribe();
  }, [queryClient]);

  const registerWorker = useMutation({
    mutationFn: async (worker: Omit<MigrantWorker, "id" | "status" | "registrationDate">) => {
      try {
        return await registerWorkerInDB(worker);
      } catch (error: any) {
        console.error("Registration error in mutation:", error);
        throw new Error(error.message || "Failed to register worker");
      }
    },
    onError: (error: Error) => {
      console.error("Worker registration error:", error);
      toast.error(error.message || "Failed to register worker");
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
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
