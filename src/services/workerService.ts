import { MigrantWorker } from '@/types/worker';
import { 
  registerWorker, 
  getWorker, 
  updateWorker, 
  deleteWorker, 
  getAllWorkers,
  subscribeToWorkers 
} from '@/utils/supabaseClient';
import { toast } from 'sonner';

export async function registerNewWorker(workerData: Omit<MigrantWorker, 'id'>) {
  try {
    // Validate required fields (match form and DB schema)
    if (
      !workerData.name ||
      !workerData.age ||
      !workerData.phone ||
      !workerData.aadhaar ||
      !workerData.originState ||
      !workerData.skill
    ) {
      throw new Error('Missing required fields');
    }

    // Map fields to match Supabase table columns (snake_case)
    const {
      originState,
      photoUrl,
      name,
      age,
      phone,
      email,
      aadhaar,
      skill,
      ...rest
    } = workerData;

    const newWorker = {
      full_name: name,
      phone_number: phone,
      age: age,
      email_address: email,
      aadhaar_number: aadhaar,
      origin_state: originState,
      primary_skill: skill,
      photo_url: photoUrl,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...rest
    };

    const { data, error } = await registerWorker(newWorker);
    
    if (error) {
      // User-friendly error handling
      if (error.message.includes('duplicate key value') && error.message.includes('workers_phone_key')) {
        toast.error('This phone number is already registered. Please use a different phone number.');
        return;
      }
      if (error.message.includes('violates not-null constraint')) {
        toast.error('A required field is missing. Please fill in all required fields.');
        return;
      }
      if (error.message.includes('invalid input syntax for type')) {
        toast.error('Invalid input format. Please check your entries.');
        return;
      }
      toast.error(error.message || 'Failed to register worker');
      throw error;
    }
    toast.success('Worker registered successfully!');
    return data;
  } catch (error) {
    console.error('Error registering worker:', error);
    toast.error(error.message || 'Failed to register worker');
    throw error;
  }
}

export async function getWorkerById(id: number) {
  try {
    const { data, error } = await getWorker(id);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching worker:', error);
    throw error;
  }
}

export async function updateWorkerDetails(id: number, updates: Partial<MigrantWorker>) {
  try {
    const { data, error } = await updateWorker(id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating worker:', error);
    throw error;
  }
}

export async function deleteWorkerById(id: number) {
  try {
    const { error } = await deleteWorker(id);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting worker:', error);
    throw error;
  }
}

export async function getAllRegisteredWorkers() {
  try {
    const { data, error } = await getAllWorkers();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching workers:', error);
    throw error;
  }
}

export function subscribeToWorkerUpdates(callback: () => void) {
  return subscribeToWorkers(callback);
} 