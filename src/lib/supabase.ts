import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Worker registration
export async function registerWorker(workerData: any) {
  try {
    return await supabase
      .from('workers')
      .insert([workerData])
      .select('*')
      .single();
  } catch (error) {
    console.error('Error registering worker:', error);
    return { data: null, error };
  }
}

// Get a single worker
export async function getWorker(id: string) {
  try {
    return await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error('Error fetching worker:', error);
    return { data: null, error };
  }
}

// Get all workers
export async function getAllWorkers() {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching workers:', error);
    
    // Try to get from localStorage as fallback
    try {
      const storedWorkers = localStorage.getItem('workers');
      if (storedWorkers) {
        return { data: JSON.parse(storedWorkers), error: null };
      }
    } catch (storageError) {
      console.error('Error reading from localStorage:', storageError);
    }
    
    return { data: null, error };
  }
}