
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Worker } from "@/types/worker";
import { registerWorkerInDB, getAllWorkers, updateWorkerStatus } from "@/utils/firebase";

export function useWorkers() {
  const queryClient = useQueryClient();
  
  const workersQuery = useQuery({
    queryKey: ["workers"],
    queryFn: getAllWorkers,
  });

  const registerWorker = useMutation({
    mutationFn: async (worker: Omit<Worker, "id" | "status" | "registrationDate">) => {
      return await registerWorkerInDB(worker);
    },
    onSuccess: (newWorker) => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toast.success("Worker registered successfully!", {
        description: `Worker ID: ${newWorker.id}`,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to register worker");
    },
  });

  const updateWorker = useMutation({
    mutationFn: async (worker: Worker) => {
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
