import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MigrantWorker } from "@/types/worker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVtb3VzZXIiLCJhIjoiY2xhd2lioTJzMGkwbzN5bXBwZjE2bnF1cCJ9.8rCpA8p9no3k4YrPQjd5dg";

interface WorkerLocation {
  workerId: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface MockMessageEvent extends Omit<MessageEvent<any>, 'data'> {
  data: string;
  lastEventId: string;
  origin: string;
  ports: MessagePort[];
  source: MessageEventSource | null;
  initMessageEvent: (
    type: string, 
    bubbles: boolean, 
    cancelable: boolean, 
    data?: any, 
    origin?: string, 
    lastEventId?: string, 
    source?: MessageEventSource | null
  ) => void;
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

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [80.2707, 13.0827],
      zoom: 10,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    
    mapRef.current = map;

    fetchWorkers();

    return () => {
      map.remove();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/worker-locations`;

    try {
      const mockSocket = new MockWebSocket(wsUrl);
      socketRef.current = mockSocket as unknown as WebSocket;
      
      mockSocket.onopen = () => {
        setConnected(true);
        toast.success("Connected to location service");
        
        startMockLocationUpdates();
      };
      
      mockSocket.onmessage = (event: MockMessageEvent) => {
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
      
      mockSocket.onerror = (error: any) => {
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

  useEffect(() => {
    if (!mapRef.current) return;
    
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
  }, [workerLocations, showHistory]);

  const fetchWorkers = async () => {
    try {
      const { data: workerData, error } = await supabase.from("workers").select("*");
      
      if (error || !workerData) {
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
    setWorkerLocations(prev => ({
      ...prev,
      [locationUpdate.workerId]: locationUpdate
    }));
    
    setLocationHistory(prev => {
      const workerHistory = prev[locationUpdate.workerId] || [];
      return {
        ...prev,
        [locationUpdate.workerId]: [...workerHistory, locationUpdate].slice(-100)
      };
    });
    
    storeLocationHistory(locationUpdate);
  };

  const storeLocationHistory = (location: WorkerLocation) => {
    try {
      const historyKey = `worker_location_history_${location.workerId}`;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const updatedHistory = [...existingHistory, location].slice(-1000);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Failed to store location history:", error);
    }
  };

  const displayHistoryPaths = () => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    if (map.getLayer('route')) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');

    Object.entries(locationHistory).forEach(([workerId, locations], index) => {
      if (locations.length < 2) return;
      
      const sourceId = `route-${workerId}`;
      const layerId = `route-layer-${workerId}`;
      
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      
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

  class MockWebSocket {
    url: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: MockMessageEvent) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: ((error: any) => void) | null = null;
    readyState = 0;

    constructor(url: string) {
      this.url = url;
      
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

  const startMockLocationUpdates = () => {
    fetchWorkers().then(() => {
      const baseCoordinates = {
        latitude: 13.0827,
        longitude: 80.2707
      };
      
      workers.forEach((worker, index) => {
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
      
      const interval = setInterval(() => {
        if (!socketRef.current || socketRef.current.readyState !== 1) {
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
          
          if (socketRef.current && socketRef.current.onmessage) {
            const mockEvent: MockMessageEvent = {
              data: JSON.stringify({
                type: 'location_update',
                worker: newLocation
              }),
              lastEventId: '',
              origin: '',
              ports: [],
              source: null,
              bubbles: false,
              cancelBubble: false,
              cancelable: false,
              composed: false,
              currentTarget: null,
              defaultPrevented: false,
              eventPhase: 0,
              isTrusted: true,
              returnValue: true,
              srcElement: null,
              target: null,
              timeStamp: Date.now(),
              type: 'message',
              composedPath: () => [],
              initEvent: () => {},
              preventDefault: () => {},
              stopImmediatePropagation: () => {},
              stopPropagation: () => {},
              AT_TARGET: 2,
              BUBBLING_PHASE: 3,
              CAPTURING_PHASE: 1,
              NONE: 0,
              initMessageEvent: (
                type: string, 
                bubbles: boolean = false, 
                cancelable: boolean = false, 
                data?: any, 
                origin?: string = '', 
                lastEventId?: string = '', 
                source?: MessageEventSource | null = null
              ) => {
                console.log('Mock initMessageEvent called', { type, bubbles, cancelable, data, origin, lastEventId, source });
              }
            };
            
            socketRef.current.onmessage(mockEvent);
          }
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
