
export interface Worker {
  id: string;
  name: string;
  age: number;
  phone: string;
  skill: string;
  originState: string;
  status: "active" | "inactive" | "pending";
  registrationDate: string;
  photoUrl?: string;
  aadhaar: string;
}
