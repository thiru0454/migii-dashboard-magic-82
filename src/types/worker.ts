export interface MigrantWorker {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  originState: string;
  skill: string;
  aadhaar: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  updatedAt?: string;
}
