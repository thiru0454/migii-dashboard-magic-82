import { createContext, useContext, useState, ReactNode } from "react";
import { MigrantWorker } from "@/types/worker";

interface WorkersContextType {
  workers: MigrantWorker[];
  addWorker: (worker: MigrantWorker) => void;
  updateWorker: (workerId: string, updates: Partial<MigrantWorker>) => void;
  removeWorker: (workerId: string) => void;
}

const WorkersContext = createContext<WorkersContextType | undefined>(undefined);

export function WorkersProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);

  const addWorker = (worker: MigrantWorker) => {
    setWorkers(prev => [...prev, worker]);
  };

  const updateWorker = (workerId: string, updates: Partial<MigrantWorker>) => {
    setWorkers(prev =>
      prev.map(worker =>
        worker.id === workerId
          ? { ...worker, ...updates }
          : worker
      )
    );
  };

  const removeWorker = (workerId: string) => {
    setWorkers(prev => prev.filter(worker => worker.id !== workerId));
  };

  return (
    <WorkersContext.Provider value={{ workers, addWorker, updateWorker, removeWorker }}>
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