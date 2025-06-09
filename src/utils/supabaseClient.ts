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
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    },
  },
});

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { connected: false, error };
    }
    
    console.log('Supabase connection test successful');
    return { connected: true, error: null };
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return { connected: false, error };
  }
}

// Get all workers
export async function getAllWorkers() {
  try {
    // First test the connection
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.connected) {
      console.warn('Supabase connection failed, using fallback data');
      
      // Try to get from localStorage as fallback
      try {
        const storedWorkers = localStorage.getItem('workers');
        if (storedWorkers) {
          console.log('Using fallback data from localStorage');
          return { data: JSON.parse(storedWorkers), error: null };
        }
      } catch (storageError) {
        console.error('Error reading from localStorage:', storageError);
      }
      
      // Return empty array if no fallback data available
      return { data: [], error: connectionTest.error };
    }

    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching workers:', error);
    
    // Try to get from localStorage as fallback
    try {
      const storedWorkers = localStorage.getItem('workers');
      if (storedWorkers) {
        console.log('Using fallback data from localStorage');
        return { data: JSON.parse(storedWorkers), error: null };
      }
    } catch (storageError) {
      console.error('Error reading from localStorage:', storageError);
    }
    
    return { data: [], error };
  }
}

// Get active jobs
export async function getActiveJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('posted_at', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching active jobs:', error);
    return { data: [], error };
  }
}

// Subscribe to workers changes
export function subscribeToWorkers(callback: () => void) {
  try {
    const subscription = supabase
      .channel('workers_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'workers' 
        }, 
        () => {
          console.log('Workers table changed, triggering callback');
          callback();
        }
      )
      .subscribe();

    return subscription;
  } catch (error) {
    console.error('Error setting up subscription:', error);
    return null;
  }
}

// Worker registration
export async function registerWorker(workerData: any) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .insert([workerData])
      .select('*')
      .single();
      
    if (error) {
      console.error('Supabase error registering worker:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error registering worker:', error);
    return { data: null, error };
  }
}

// Get a single worker
export async function getWorker(id: string) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Supabase error fetching worker:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching worker:', error);
    return { data: null, error };
  }
}

// Update a worker
export async function updateWorker(id: string, workerData: any) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .update(workerData)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Supabase error updating worker:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating worker:', error);
    return { data: null, error };
  }
}

// Delete a worker
export async function deleteWorker(id: string) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Supabase error deleting worker:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting worker:', error);
    return { data: null, error };
  }
}

// Submit job application
export async function submitJobApplication(applicationData: any) {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .insert([applicationData])
      .select('*')
      .single();
      
    if (error) {
      console.error('Supabase error submitting job application:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error submitting job application:', error);
    return { data: null, error };
  }
}