import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MigrantWorker } from "@/types/worker";
import { getAllWorkers, subscribeToWorkers } from "@/utils/supabaseClient";

function mapWorker(w: any): MigrantWorker {
  return {
    id: w.id,
    name: w.full_name,
    age: w.age,
    phone: w.phone_number,
    email: w.email_address,
    skill: w.primary_skill || w.skill || "",
    originState: w.origin_state || w.originState || "",
    status: w.status || "active",
    registrationDate: w.created_at,
    photoUrl: w.photo_url || w.photoUrl || "",
    latitude: w.latitude,
    longitude: w.longitude,
    aadhaar: w.aadhaar_number || w.aadhaar || "",
    assignedBusinessId: w.assignedBusinessId,
  };
}

export function useWorkers() {
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);

  useEffect(() => {
    setIsLoadingWorkers(true);
    getAllWorkers()
      .then(({ data, error }) => {
        console.log("Supabase workers:", data, error); // Debug log
        if (error) {
          toast.error("Failed to fetch workers from Supabase");
          setWorkers([]);
        } else {
          const mapped = (data || []).map(mapWorker);
          setWorkers(mapped);
        }
        setIsLoadingWorkers(false);
      });

    // Real-time subscription
    const channel = subscribeToWorkers(() => {
      getAllWorkers()
        .then(({ data, error }) => {
          console.log("Supabase workers (realtime):", data, error); // Debug log
          if (!error) {
            const mapped = (data || []).map(mapWorker);
            setWorkers(mapped);
          }
        });
    });

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, []);

  return {
    workers,
    isLoadingWorkers,
  };
}
