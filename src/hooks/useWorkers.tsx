
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Worker } from "@/components/admin/WorkersTable";

// In-memory storage until we have a backend
let mockWorkers = [...(window.mockWorkers || [])];

// Initialize with any existing mock data from the app
if (typeof window !== "undefined" && window.mockWorkers) {
  mockWorkers = [...window.mockWorkers];
} else if (typeof window !== "undefined") {
  // Import data only on client-side
  import("@/data/mockData").then((module) => {
    mockWorkers = [...module.mockWorkers];
    window.mockWorkers = mockWorkers;
  });
}

export function useWorkers() {
  const queryClient = useQueryClient();
  
  const workersQuery = useQuery({
    queryKey: ["workers"],
    queryFn: () => Promise.resolve(mockWorkers),
  });

  const registerWorker = useMutation({
    mutationFn: (worker: Omit<Worker, "id" | "status" | "registrationDate">) => {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const workerId = `TN-MIG-${dateStr}-${randomNum}`;
      
      const registrationDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      
      const newWorker: Worker = {
        id: workerId,
        name: worker.name,
        age: worker.age,
        phone: worker.phone,
        originState: worker.originState,
        skill: worker.skill,
        status: "active",
        registrationDate,
        photoUrl: worker.photoUrl,
      };
      
      // Add to our mock data
      mockWorkers = [...mockWorkers, newWorker];
      
      // Save to window for persistence during the session
      if (typeof window !== "undefined") {
        window.mockWorkers = mockWorkers;
      }
      
      return Promise.resolve(newWorker);
    },
    onSuccess: (newWorker) => {
      // Invalidate the workers query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      
      toast.success("Worker registered successfully!", {
        description: `Worker ID: ${newWorker.id}`,
      });
    },
    onError: () => {
      toast.error("Failed to register worker", {
        description: "Please try again later",
      });
    },
  });

  return {
    workers: workersQuery.data || [],
    isLoadingWorkers: workersQuery.isLoading,
    registerWorker,
  };
}

// Add type definition for the window object
declare global {
  interface Window {
    mockWorkers?: Worker[];
  }
}
