import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MigrantWorker } from "@/types/worker";
import { getAllWorkers, subscribeToWorkers } from "@/utils/supabaseClient";

export function useWorkers() {
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setIsLoadingWorkers(true);
    // Initial fetch from Supabase
    getAllWorkers()
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to fetch workers from Supabase");
          setWorkers([]);
        } else {
          setWorkers(data || []);
        }
        setIsLoadingWorkers(false);
      });

    // Real-time subscription
    unsubscribe = subscribeToWorkers(() => {
      getAllWorkers()
        .then(({ data, error }) => {
          if (!error) setWorkers(data || []);
        });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    workers,
    isLoadingWorkers,
  };
}
