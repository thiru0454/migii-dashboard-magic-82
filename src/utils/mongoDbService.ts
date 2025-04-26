import { MigrantWorker } from "@/types/worker";

// MongoDB connection URI
const MONGODB_URI = "mongodb+srv://thirumalai0454:6936MlsrTO5SYslL@cluster0.zwlpnzk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Interface for worker location data
export interface WorkerLocation {
  workerId: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

// Simulated MongoDB Service for frontend
// In a production environment, these operations would be performed through a backend API
class MongoDbService {
  private isConnected: boolean = false;
  private workers: MigrantWorker[] = [];
  private workerLocations: Record<string, WorkerLocation> = {};
  private locationHistory: Record<string, WorkerLocation[]> = {};

  constructor() {
    this.connectToDatabase();
  }

  private async connectToDatabase(): Promise<void> {
    try {
      // In a real implementation, this would use an API endpoint to connect to MongoDB
      console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI}`);
      
      // Simulating connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, simulate successful connection
      this.isConnected = true;
      console.log("Connected to MongoDB successfully");
      
      // Load workers from local storage for demo purposes
      this.loadWorkersFromStorage();
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      this.isConnected = false;
    }
  }

  private loadWorkersFromStorage(): void {
    try {
      const storedWorkers = localStorage.getItem('workers');
      if (storedWorkers) {
        this.workers = JSON.parse(storedWorkers);
        console.log(`Loaded ${this.workers.length} workers from storage`);
      }
    } catch (error) {
      console.error("Failed to load workers from storage:", error);
    }
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  public async getWorkers(): Promise<MigrantWorker[]> {
    // In a real implementation, this would fetch workers from MongoDB
    return this.workers;
  }

  public async updateWorkerLocation(location: WorkerLocation): Promise<void> {
    // Update current location
    this.workerLocations[location.workerId] = location;
    
    // Update location history
    if (!this.locationHistory[location.workerId]) {
      this.locationHistory[location.workerId] = [];
    }
    this.locationHistory[location.workerId].push(location);
    
    // Keep only the last 100 location points
    if (this.locationHistory[location.workerId].length > 100) {
      this.locationHistory[location.workerId] = this.locationHistory[location.workerId].slice(-100);
    }
    
    // Store in localStorage for persistence
    this.storeLocationHistory(location.workerId);
  }

  private storeLocationHistory(workerId: string): void {
    try {
      const historyKey = `worker_location_history_${workerId}`;
      localStorage.setItem(
        historyKey, 
        JSON.stringify(this.locationHistory[workerId])
      );
    } catch (error) {
      console.error("Failed to store location history:", error);
    }
  }

  public getWorkerLocation(workerId: string): WorkerLocation | null {
    return this.workerLocations[workerId] || null;
  }

  public getAllWorkerLocations(): Record<string, WorkerLocation> {
    return this.workerLocations;
  }

  public getWorkerLocationHistory(workerId: string): WorkerLocation[] {
    return this.locationHistory[workerId] || [];
  }

  public getAllLocationHistories(): Record<string, WorkerLocation[]> {
    return this.locationHistory;
  }
}

// Create singleton instance
const mongoDbService = new MongoDbService();

export default mongoDbService;
