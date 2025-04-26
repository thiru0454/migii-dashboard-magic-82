
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MigrantWorker } from "@/types/worker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";

// Demo token from your existing WorkersMap component
const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVtb3VzZXIiLCJhIjoiY2xhd2lioTJzMGkwbzN5bXBwZjE2bnF1cCJ9.8rCpA8p9no3k4YrPQjd5dg";

interface WorkerLocation {
  workerId: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export function WorkerTrackingMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [workerLocations, setWorkerLocations] = useState<Record<string, WorkerLocation>>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [locationHistory, setLocationHistory] = useState<Record<string, WorkerLocation[]>>({});
  const [showHistory, setShowHistory] = useState(false);

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [80.2707, 13.0827], // Chennai default
      zoom: 10,
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    
    mapRef.current = map;

    // Fetch initial workers data
    fetchWorkers();

    return () => {
      map.remove();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Use secure WebSocket if on HTTPS
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/worker-locations`;

    try {
      // Use a mock WebSocket for demo purposes
      // In production, replace with actual WebSocket connection
      const mockSocket = new MockWebSocket(wsUrl);
      socketRef.current = mockSocket as unknown as WebSocket;
      
      mockSocket.onopen = () => {
        setConnected(true);
        toast.success("Connected to location service");
        
        // Set up mock data updates for demonstration
        startMockLocationUpdates();
      };
      
      mockSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'location_update') {
            updateWorkerLocation(data.worker);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };
      
      mockSocket.onclose = () => {
        setConnected(false);
        toast.error("Disconnected from location service");
      };
      
      mockSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("Location service connection error");
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      toast.error("Failed to connect to location service");
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Update markers when worker locations change
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Update or create markers for each worker
    Object.values(workerLocations).forEach((location) => {
      const { workerId, name, latitude, longitude } = location;
      
      if (markersRef.current[workerId]) {
        // Update existing marker position
        markersRef.current[workerId].setLngLat([longitude, latitude]);
      } else {
        // Create a new marker with popup
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

    // Center map if we have only one worker
    if (Object.keys(workerLocations).length === 1) {
      const location = Object.values(workerLocations)[0];
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 12,
        speed: 1.5
      });
    }
    
    // Display history paths if enabled
    if (showHistory) {
      displayHistoryPaths();
    }
  }, [workerLocations, showHistory]);

  const fetchWorkers = async () => {
    try {
      // First try to get workers from Supabase
      const { data: workerData, error } = await supabase.from("workers").select("*");
      
      if (error || !workerData) {
        // Fallback to local storage if Supabase fails
        const localWorkers = getAllWorkersFromStorage();
        setWorkers(localWorkers);
      } else {
        setWorkers(workerData);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("Failed to fetch workers");
    }
  };

  const updateWorkerLocation = (locationUpdate: WorkerLocation) => {
    // Add to current locations
    setWorkerLocations(prev => ({
      ...prev,
      [locationUpdate.workerId]: locationUpdate
    }));
    
    // Add to location history
    setLocationHistory(prev => {
      const workerHistory = prev[locationUpdate.workerId] || [];
      return {
        ...prev,
        [locationUpdate.workerId]: [...workerHistory, locationUpdate].slice(-100) // Keep last 100 points
      };
    });
    
    // Store in local storage
    storeLocationHistory(locationUpdate);
  };
  
  const storeLocationHistory = (location: WorkerLocation) => {
    try {
      const historyKey = `worker_location_history_${location.workerId}`;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const updatedHistory = [...existingHistory, location].slice(-1000); // Keep last 1000 points
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Failed to store location history:", error);
    }
  };

  const displayHistoryPaths = () => {
    if (!mapRef.current) return;
    
    // Remove existing history layers
    const map = mapRef.current;
    if (map.getLayer('route')) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');

    // Create a route for each worker's history
    Object.entries(locationHistory).forEach(([workerId, locations], index) => {
      if (locations.length < 2) return;
      
      const sourceId = `route-${workerId}`;
      const layerId = `route-layer-${workerId}`;
      
      // Remove existing layers for this worker
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      
      // Create a GeoJSON line from the worker's history points
      const coordinates = locations.map(loc => [loc.longitude, loc.latitude]);
      
      // Add the line to the map
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
      
      // Choose different colors for different workers
      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8'];
      const color = colors[index % colors.length];
      
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

  // Mock WebSocket implementation for demonstration
  class MockWebSocket {
    url: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: ((error: any) => void) | null = null;
    readyState = 0;

    constructor(url: string) {
      this.url = url;
      
      // Simulate connection
      setTimeout(() => {
        this.readyState = 1;
        if (this.onopen) this.onopen();
      }, 1000);
    }

    send(data: string) {
      console.log("Mock WebSocket sending data:", data);
    }

    close() {
      this.readyState = 3;
      if (this.onclose) this.onclose();
    }
  }

  // Generate mock location updates for demonstration
  const startMockLocationUpdates = () => {
    fetchWorkers().then(() => {
      // Get initial coordinates for each worker (centered around Chennai)
      const baseCoordinates = {
        latitude: 13.0827,
        longitude: 80.2707
      };
      
      // Set initial positions for workers
      workers.forEach((worker, index) => {
        // Distribute workers around the base location
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
      });
      
      // Start sending mock updates
      const interval = setInterval(() => {
        if (!socketRef.current || socketRef.current.readyState !== 1) {
          clearInterval(interval);
          return;
        }
        
        // Update each worker's location slightly
        Object.values(workerLocations).forEach(location => {
          // Random movement in a small area
          const newLocation = {
            ...location,
            latitude: location.latitude + (Math.random() - 0.5) * 0.005,
            longitude: location.longitude + (Math.random() - 0.5) * 0.005,
            timestamp: Date.now()
          };
          
          // Simulate receiving a WebSocket message
          if (socketRef.current && socketRef.current.onmessage) {
            socketRef.current.onmessage({
              data: JSON.stringify({
                type: 'location_update',
                worker: newLocation
              })
            });
          }
        });
      }, 3000); // Update every 3 seconds
      
      return () => clearInterval(interval);
    });
  };

  const toggleHistoryView = () => {
    setShowHistory(!showHistory);
  };

  const centerMap = () => {
    if (!mapRef.current || Object.keys(workerLocations).length === 0) return;
    
    // Calculate the average position of all workers
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

  // Function to get workers from localStorage (utility function from firebase.ts)
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
