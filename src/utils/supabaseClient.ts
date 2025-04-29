import { createClient } from '@supabase/supabase-js';
import { MigrantWorker } from '@/types/worker';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Worker registration
export async function registerWorker(workerData: Omit<MigrantWorker, 'id'>) {
  return await supabase
    .from('workers')
    .insert([{
      ...workerData,
      id: Math.floor(Math.random() * 1000000) // Generate a random bigint ID
    }])
    .select()
    .single();
}

// Get a single worker
export async function getWorker(id: number) {
  return await supabase
    .from('workers')
    .select('*')
    .eq('id', id)
    .single();
}

// Update worker details
export async function updateWorker(id: number, updates: Partial<MigrantWorker>) {
  return await supabase
    .from('workers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
}

// Delete worker
export async function deleteWorker(id: number) {
  return await supabase
    .from('workers')
    .delete()
    .eq('id', id);
}

// Get all workers
export async function getAllWorkers() {
  return await supabase
    .from('workers')
    .select('*')
    .order('created_at', { ascending: false });
}

// Subscribe to workers table changes
export function subscribeToWorkers(callback: () => void) {
  return supabase
    .channel('workers_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workers'
      },
      () => {
        callback();
      }
    )
    .subscribe();
}
