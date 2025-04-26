
<<<<<<< HEAD
export type MigrantWorker = {
=======
export interface MigrantWorker {
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
  id: string;
  name: string;
  age: number;
  phone: string;
<<<<<<< HEAD
  email?: string;
  skill: string;
  originState: string;
  status: "active" | "inactive" | "pending";
=======
  email: string | undefined;
  originState: string;
  skill: string;
  aadhaar: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
  registrationDate: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  aadhaar: string; // Changed from optional to required
  assignedBusinessId?: string;
};
