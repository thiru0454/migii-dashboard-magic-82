
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Worker } from "@/components/admin/WorkersTable";

// Define the worker type with aadhaar
export type WorkerWithAadhaar = Worker & { aadhaar: string };

// In-memory storage until we have a backend
let mockWorkers: WorkerWithAadhaar[] = [...(window.mockWorkers || [])];

// Initialize with any existing mock data from the app
if (typeof window !== "undefined" && window.mockWorkers) {
  mockWorkers = [...window.mockWorkers];
} else if (typeof window !== "undefined") {
  // Import data only on client-side
  import("@/data/mockData").then((module) => {
    mockWorkers = [...module.mockWorkers.map(worker => ({
      ...worker,
      aadhaar: worker.aadhaar || "000000000000" // Ensure aadhaar exists for all workers
    }))];
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
    mutationFn: (worker: Omit<Worker, "id" | "status" | "registrationDate"> & { aadhaar: string }) => {
      // Check if aadhaar already exists
      const existingWorker = mockWorkers.find(w => w.aadhaar === worker.aadhaar);
      if (existingWorker) {
        throw new Error("Aadhaar number already registered");
      }
      
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const workerId = `TN-MIG-${dateStr}-${randomNum}`;
      
      const registrationDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      
      const newWorker: WorkerWithAadhaar = {
        id: workerId,
        name: worker.name,
        age: worker.age,
        phone: worker.phone,
        originState: worker.originState,
        skill: worker.skill,
        status: "active",
        registrationDate,
        photoUrl: worker.photoUrl,
        aadhaar: worker.aadhaar, // Store the aadhaar number
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
    onError: (error: Error) => {
      toast.error(error.message || "Failed to register worker", {
        description: "Please try with a different Aadhaar number",
      });
    },
  });

  // Add update worker functionality
  const updateWorker = useMutation({
    mutationFn: (updatedWorker: WorkerWithAadhaar) => {
      const index = mockWorkers.findIndex(w => w.id === updatedWorker.id);
      if (index === -1) {
        throw new Error("Worker not found");
      }
      
      mockWorkers[index] = updatedWorker;
      
      // Save to window for persistence
      if (typeof window !== "undefined") {
        window.mockWorkers = mockWorkers;
      }
      
      return Promise.resolve(updatedWorker);
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

// Update the Worker type to include the aadhaar property
declare global {
  interface Window {
    mockWorkers?: WorkerWithAadhaar[];
  }
}
