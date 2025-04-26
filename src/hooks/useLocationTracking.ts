
import { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import mongoDbService, { WorkerLocation } from "@/utils/mongoDbService";

interface UseLocationTrackingProps {
  workerId: string;
  name: string;
  enabled?: boolean;
  updateInterval?: number;
}

export const useLocationTracking = ({
  workerId,
  name,
  enabled = true,
  updateInterval = 30000, // 30 seconds
}: UseLocationTrackingProps) => {
  const { latitude, longitude, error, loading } = useGeolocation();
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !workerId || loading || error) return;

    setIsTracking(true);

    // Initial location update
    if (latitude !== null && longitude !== null) {
      const location: WorkerLocation = {
        workerId,
        name,
        latitude,
        longitude,
        timestamp: Date.now(),
      };

      mongoDbService.updateWorkerLocation(location);
      setLastUpdate(new Date());
    }

    // Set up interval for regular updates
    const intervalId = setInterval(() => {
      if (latitude !== null && longitude !== null) {
        const location: WorkerLocation = {
          workerId,
          name,
          latitude,
          longitude,
          timestamp: Date.now(),
        };

        mongoDbService.updateWorkerLocation(location);
        setLastUpdate(new Date());
      }
    }, updateInterval);

    return () => {
      clearInterval(intervalId);
      setIsTracking(false);
    };
  }, [workerId, name, enabled, latitude, longitude, loading, error, updateInterval]);

  return {
    isTracking,
    lastUpdate,
    currentLocation: latitude !== null && longitude !== null
      ? { latitude, longitude }
      : null,
    error,
    loading,
  };
};
