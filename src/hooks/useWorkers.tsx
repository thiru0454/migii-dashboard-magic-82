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
  // We'll keep workers in React Query's cache using a manual subscription
  const { data: workers = [], isLoading: isLoadingWorkers, refetch } = useQuery({
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
      return registerWorkerInDB(worker);
    },
    onSuccess: (newWorker) => {
      toast.success("Worker registered successfully!");
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to register worker");
    },
  });

  const updateWorker = useMutation({
    mutationFn: async (worker: MigrantWorker) => {
      await updateWorkerStatus(worker.id, worker.status);
      return worker;
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
