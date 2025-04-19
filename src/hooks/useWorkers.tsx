
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MigrantWorker } from "@/types/worker";
import { registerWorkerInDB, getAllWorkers, updateWorkerStatus } from "@/utils/firebase";

export function useWorkers() {
  const queryClient = useQueryClient();
  
  const workersQuery = useQuery({
    queryKey: ["workers"],
    queryFn: getAllWorkers,
  });

  const registerWorker = useMutation({
    mutationFn: async (worker: Omit<MigrantWorker, "id" | "status" | "registrationDate">) => {
      return registerWorkerInDB(worker); // Remove await for faster return
    },
    // Use optimistic updates to make the UI feel faster
    onMutate: async (newWorker) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["workers"] });
      
      // Return the new worker immediately
      return { worker: newWorker };
    },
    onSuccess: (newWorker) => {
      // Update the cache in background without blocking the UI
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["workers"] });
      }, 0);
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
    workers: workersQuery.data || [],
    isLoadingWorkers: workersQuery.isLoading,
    registerWorker,
    updateWorker,
  };
}
