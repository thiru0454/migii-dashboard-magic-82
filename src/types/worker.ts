export type MigrantWorker = {
  id: string;
  name: string;
  "Full Name": string;
  age: number;
  "Age": number;
  phone: string;
  "Phone Number": string;
  email?: string;
  "Email Address"?: string;
  primarySkill?: string;
  "Primary Skill": string;
  originState?: string;
  origin_state?: string;
  "Origin State": string;
  status: "active" | "inactive" | "pending";
  registrationDate: string;
  "Photo URL"?: string;
  photoUrl?: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  aadhaar: string;
  "Aadhaar Number": string;
  assignedBusinessId?: string;
  assigned_business_id?: string;
  skill: string;
};

// Add a Worker interface that matches the one used in components
export interface Worker {
  id: string;
  name: string;
  phone: string;
  skill: string;
  status: string;
  originState?: string;
  origin_state?: string;
  age?: number;
  email?: string;
  photoUrl?: string;
  photo_url?: string;
  aadhaar?: string;
}

// Define WorkerLocation interface to use in location tracking
export interface WorkerLocation {
  workerId: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}