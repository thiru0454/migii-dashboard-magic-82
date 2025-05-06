
export type MigrantWorker = {
  id: number;
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
  "Origin State": string;
  status: "active" | "inactive" | "pending";
  registrationDate: string;
  "Photo URL"?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  aadhaar: string;
  "Aadhaar Number": string;
  assignedBusinessId?: string;
  skill?: string;
};
