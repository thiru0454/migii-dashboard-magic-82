
export type MigrantWorker = {
  id: string;
  name: string;
  age: number;
  phone: string;
  email?: string;
  skill: string;
  originState: string;
  status: "active" | "inactive" | "pending";
  registrationDate: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  aadhaar: string; // Changed from optional to required
  assignedBusinessId?: string;
};
