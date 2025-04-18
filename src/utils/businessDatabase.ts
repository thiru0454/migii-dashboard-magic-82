
// This file simulates a database until connected to a real backend

// Business user type
export interface BusinessUser {
  id: string;
  businessId: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'suspended';
}

// Initialize business users in localStorage if not already present
export const initBusinessDatabase = () => {
  if (!localStorage.getItem('businessUsers')) {
    const defaultBusinessUsers: BusinessUser[] = [
      {
        id: 'b1',
        businessId: 'BUS001',
        password: 'business123',
        name: 'ABC Construction',
        email: 'info@abcconstruction.com',
        phone: '+91 9876543210',
        registrationDate: '2025-03-15',
        status: 'active',
      },
      {
        id: 'b2',
        businessId: 'BUS002',
        password: 'business456',
        name: 'XYZ Builders',
        email: 'contact@xyzbuilders.com',
        phone: '+91 8765432109',
        registrationDate: '2025-02-20',
        status: 'active',
      },
    ];
    
    localStorage.setItem('businessUsers', JSON.stringify(defaultBusinessUsers));
  }
};

// Get all business users
export const getAllBusinessUsers = (): BusinessUser[] => {
  initBusinessDatabase();
  return JSON.parse(localStorage.getItem('businessUsers') || '[]');
};

// Get business user by ID
export const getBusinessUserById = (id: string): BusinessUser | undefined => {
  const users = getAllBusinessUsers();
  return users.find(user => user.id === id);
};

// Get business user by business ID
export const getBusinessUserByBusinessId = (businessId: string): BusinessUser | undefined => {
  const users = getAllBusinessUsers();
  return users.find(user => user.businessId === businessId);
};

// Add new business user
export const addBusinessUser = (user: Omit<BusinessUser, 'id'>): BusinessUser => {
  const users = getAllBusinessUsers();
  
  // Check if businessId already exists
  if (users.some(u => u.businessId === user.businessId)) {
    throw new Error('Business ID already exists');
  }
  
  const newUser: BusinessUser = {
    ...user,
    id: `b${users.length + 1}`,
  };
  
  users.push(newUser);
  localStorage.setItem('businessUsers', JSON.stringify(users));
  
  return newUser;
};

// Update business user
export const updateBusinessUser = (id: string, updates: Partial<BusinessUser>): BusinessUser => {
  const users = getAllBusinessUsers();
  const index = users.findIndex(user => user.id === id);
  
  if (index === -1) {
    throw new Error('Business user not found');
  }
  
  users[index] = { ...users[index], ...updates };
  localStorage.setItem('businessUsers', JSON.stringify(users));
  
  return users[index];
};

// Delete business user
export const deleteBusinessUser = (id: string): void => {
  const users = getAllBusinessUsers();
  const filteredUsers = users.filter(user => user.id !== id);
  
  if (filteredUsers.length === users.length) {
    throw new Error('Business user not found');
  }
  
  localStorage.setItem('businessUsers', JSON.stringify(filteredUsers));
};

// Authenticate business user
export const authenticateBusinessUser = (
  businessId: string,
  password: string
): BusinessUser | null => {
  const users = getAllBusinessUsers();
  const user = users.find(
    u => u.businessId === businessId && u.password === password && u.status === 'active'
  );
  
  return user || null;
};
