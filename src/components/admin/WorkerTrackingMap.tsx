
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MigrantWorker } from "@/types/worker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import mongoDbService, { WorkerLocation } from "@/utils/mongoDbService";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVtb3VzZXIiLCJhIjoiY2xhd2lioTJzMGkwbzN5bXBwZjE2bnF1cCJ9.8rCpA8p9no3k4YrPQjd5dg";

export function WorkerTrackingMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [workerLocations, setWorkerLocations] = useState<Record<string, WorkerLocation>>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    console.log("Initializing worker tracking map");
    
    // Small delay to ensure the container is properly rendered
    const timer = setTimeout(() => {
      initializeMap();
    }, 300);
    
    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  const initializeMap = () => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [80.2707, 13.0827],
        zoom: 10,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      
      map.on('load', () => {
        console.log("Map loaded successfully");
        setMapInitialized(true);
        fetchWorkers();
      });
      
      map.on('error', (e) => {
        console.error("Map error:", e);
        toast.error("Error loading map");
      });
      
      mapRef.current = map;
    } catch (error) {
      console.error("Failed to initialize map:", error);
      toast.error("Failed to initialize map");
    }
  };

  useEffect(() => {
    const mockWebSocketConnection = async () => {
      try {
        // Check MongoDB connection status
        const isConnected = mongoDbService.isConnectedToDatabase();
        
        if (isConnected) {
          setConnected(true);
          toast.success("Connected to location service");
          
          startMockLocationUpdates();
        } else {
          toast.error("Failed to connect to location service");
          setConnected(false);
          
          // Force reconnect
          mongoDbService.forceReconnect();
        }
      } catch (error) {
        console.error("WebSocket error:", error);
        toast.error("Location service connection error");
      }
    };
    
    if (mapInitialized) {
      mockWebSocketConnection();
    }
    
    return () => {
      // Cleanup
    };
  }, [mapInitialized]);

  useEffect(() => {
    if (!mapRef.current || !mapInitialized) return;
    
    console.log("Updating worker locations on map:", Object.keys(workerLocations).length);
    
    Object.values(workerLocations).forEach((location) => {
      const { workerId, name, latitude, longitude } = location;
      
      if (markersRef.current[workerId]) {
        markersRef.current[workerId].setLngLat([longitude, latitude]);
      } else {
        const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
          `<div class="p-2">
            <strong>${name}</strong>
            <br>Worker ID: ${workerId}
            <br>Lat: ${latitude.toFixed(6)}
            <br>Long: ${longitude.toFixed(6)}
          </div>`
        );
        
        const marker = new mapboxgl.Marker({ color: "#8B5CF6" })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(mapRef.current);
          
        markersRef.current[workerId] = marker;
      }
    });

    if (Object.keys(workerLocations).length === 1) {
      const location = Object.values(workerLocations)[0];
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 12,
        speed: 1.5
      });
    }
    
    if (showHistory) {
      displayHistoryPaths();
    }
  }, [workerLocations, showHistory, mapInitialized]);

  const fetchWorkers = async () => {
    try {
      console.log("Fetching workers");
      const { data: workerData, error } = await supabase.from("workers").select("*");
      
      if (error || !workerData) {
        console.log("Error fetching from Supabase, using local storage");
        const localWorkers = getAllWorkersFromStorage();
        setWorkers(localWorkers);
      } else {
        console.log(`Loaded ${workerData.length} workers from Supabase`);
        setWorkers(workerData);
        
        // Also load all existing locations
        const existingLocations = mongoDbService.getAllWorkerLocations();
        if (Object.keys(existingLocations).length > 0) {
          console.log(`Loaded ${Object.keys(existingLocations).length} existing locations`);
          setWorkerLocations(existingLocations);
        }
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("Failed to fetch workers");
    }
  };

  const updateWorkerLocation = (location: WorkerLocation) => {
    mongoDbService.updateWorkerLocation(location)
      .then(() => {
        setWorkerLocations(prev => ({
          ...prev,
          [location.workerId]: location
        }));
      })
      .catch(error => {
        console.error("Failed to update worker location:", error);
      });
  };

  const displayHistoryPaths = () => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    // Remove all existing layers and sources
    Object.keys(workerLocations).forEach(workerId => {
      const sourceId = `route-${workerId}`;
      const layerId = `route-layer-${workerId}`;
      
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });

    // Get all location histories from MongoDB service
    const allHistories = mongoDbService.getAllLocationHistories();
    
    Object.entries(allHistories).forEach(([workerId, locations], index) => {
      if (locations.length < 2) return;
      
      const sourceId = `route-${workerId}`;
      const layerId = `route-layer-${workerId}`;
      
      const coordinates = locations.map(loc => [loc.longitude, loc.latitude]);
      
      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8'];
      const color = colors[index % colors.length];
      
      map.addSource(sourceId, {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
          }
        }
      });
      
      map.addLayer({
        'id': layerId,
        'type': 'line',
        'source': sourceId,
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': color,
          'line-width': 3,
          'line-opacity': 0.7
        }
      });
    });
  };

  const startMockLocationUpdates = () => {
    fetchWorkers().then(() => {
      const baseCoordinates = {
        latitude: 13.0827,
        longitude: 80.2707
      };
      
      workers.forEach((worker) => {
        // Check if worker already has a location
        const existingLocation = mongoDbService.getWorkerLocation(worker.id);
        
        if (!existingLocation) {
          const latitude = baseCoordinates.latitude + (Math.random() - 0.5) * 0.1;
          const longitude = baseCoordinates.longitude + (Math.random() - 0.5) * 0.1;
          
          const initialLocation = {
            workerId: worker.id,
            name: worker.name,
            latitude,
            longitude, 
            timestamp: Date.now()
          };
          
          updateWorkerLocation(initialLocation);
        } else {
          // Use existing location
          setWorkerLocations(prev => ({
            ...prev,
            [worker.id]: existingLocation
          }));
        }
      });
      
      const interval = setInterval(() => {
        if (!connected) {
          clearInterval(interval);
          return;
        }
        
        Object.values(workerLocations).forEach(location => {
          const newLocation = {
            ...location,
            latitude: location.latitude + (Math.random() - 0.5) * 0.005,
            longitude: location.longitude + (Math.random() - 0.5) * 0.005,
            timestamp: Date.now()
          };
          
          updateWorkerLocation(newLocation);
        });
      }, 3000);
      
      return () => clearInterval(interval);
    });
  };

  const toggleHistoryView = () => {
    setShowHistory(!showHistory);
  };

  const centerMap = () => {
    if (!mapRef.current || Object.keys(workerLocations).length === 0) return;
    
    const locations = Object.values(workerLocations);
    const totalLat = locations.reduce((sum, loc) => sum + loc.latitude, 0);
    const totalLng = locations.reduce((sum, loc) => sum + loc.longitude, 0);
    
    const avgLat = totalLat / locations.length;
    const avgLng = totalLng / locations.length;
    
    mapRef.current.flyTo({
      center: [avgLng, avgLat],
      zoom: 10,
      speed: 1
    });
  };

  const getAllWorkersFromStorage = (): MigrantWorker[] => {
    const workersStr = localStorage.getItem('workers');
    return workersStr ? JSON.parse(workersStr) : [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Worker Tracking</h2>
          <p className="text-sm text-muted-foreground">
            {connected ? 
              `Live tracking active: ${Object.keys(workerLocations).length} workers` : 
              'Connecting to tracking service...'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleHistoryView}
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={centerMap}
          >
            Center Map
          </Button>
        </div>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-[60vh] rounded-lg border shadow relative"
      >
        {!connected && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p>Connecting to tracking service...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

