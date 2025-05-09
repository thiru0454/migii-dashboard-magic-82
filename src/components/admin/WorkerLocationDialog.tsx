
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MigrantWorker, WorkerLocation } from "@/types/worker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

// Fix Leaflet icon issue
// This is needed because Leaflet's assets are not properly loaded in React
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

interface WorkerLocationDialogProps {
  worker: MigrantWorker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerLocationDialog({ worker, open, onOpenChange }: WorkerLocationDialogProps) {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<WorkerLocation | null>(null);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  const fetchWorkerLocation = async () => {
    if (!worker) return;
    setLoading(true);
    try {
      console.log('Fetching location for worker:', worker.id);
      
      // First try to get from worker_locations table
      const { data: locationData, error } = await supabase
        .from('worker_locations')
        .select('*')
        .eq('worker_id', worker.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log('No location found in worker_locations, checking worker profile');
        // If no location found, use worker's profile location
        setLocation({
          workerId: worker.id,
          name: worker.name,
          latitude: worker.latitude || 13.0827,
          longitude: worker.longitude || 80.2707,
          timestamp: Date.now()
        });
        return;
      }

      if (!locationData) {
        console.log('No location data found, using worker profile location');
        setLocation({
          workerId: worker.id,
          name: worker.name,
          latitude: worker.latitude || 13.0827,
          longitude: worker.longitude || 80.2707,
          timestamp: Date.now()
        });
        return;
      }

      console.log('Location data received:', locationData);
      setLocation({
        workerId: worker.id,
        name: worker.name,
        latitude: locationData.latitude || worker.latitude || 13.0827,
        longitude: locationData.longitude || worker.longitude || 80.2707,
        timestamp: new Date(locationData.created_at).getTime()
      });
      toast.success('Location updated successfully');
    } catch (e) {
      console.error('Exception while fetching worker location:', e);
      toast.error('An error occurred while fetching location');
      setLocation({
        workerId: worker.id,
        name: worker.name,
        latitude: worker.latitude || 13.0827,
        longitude: worker.longitude || 80.2707,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !worker) return;
    fetchWorkerLocation();
  }, [open, worker]);

  // Update map center when location changes
  useEffect(() => {
    if (mapRef && location) {
      mapRef.setView([location.latitude, location.longitude], 13);
    }
  }, [location, mapRef]);

  const position: [number, number] = location ? 
    [location.latitude, location.longitude] : 
    [13.0827, 80.2707];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Track Worker Location</DialogTitle>
          <DialogDescription>
            View the real-time location of the selected worker on the map.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <span>Loading map...</span>
          </div>
        ) : (
          <>
            <div className="w-full h-96">
              <MapContainer 
                className="h-full w-full" 
                style={{ height: '100%', width: '100%' }}
              >
                {/* Initialize map view after component is mounted */}
                {(() => {
                  // This IIFE will run once when the component mounts
                  if (typeof window !== 'undefined') {
                    // Safety check for SSR
                    setTimeout(() => {
                      // Use setTimeout to ensure the map element is available
                      const container = document.querySelector('.leaflet-container');
                      if (container && !mapRef) {
                        const map = L.map(container as HTMLElement).setView(position, 13);
                        setMapRef(map);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                          attribution: '&copy; OpenStreetMap contributors'
                        }).addTo(map);
                        
                        L.marker(position)
                          .addTo(map)
                          .bindPopup(`<strong>${worker?.name}</strong><br />Lat: ${position[0].toFixed(6)}, Lng: ${position[1].toFixed(6)}`);
                      }
                    }, 100);
                  }
                  return null;
                })()}
              </MapContainer>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Last updated: {location?.timestamp ? new Date(location.timestamp).toLocaleString() : 'N/A'}<br />
                Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchWorkerLocation}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Location
              </Button>
            </div>
          </>
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
