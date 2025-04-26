import { MigrantWorker } from '@/types/worker';

export async function registerWorker(workerData: MigrantWorker) {
  try {
    console.log('Starting worker registration...');

    // Generate a unique ID for the worker
    const newWorker = {
      ...workerData,
      id: `worker_${Date.now()}`,
      status: 'pending',
      registrationDate: new Date().toISOString()
    };

    // Get existing workers from localStorage
    const existingWorkers = JSON.parse(localStorage.getItem('workers') || '[]');

    // Check for duplicate registration
    const isDuplicate = existingWorkers.some(
      (worker: MigrantWorker) => 
        worker.email === workerData.email || 
        worker.phone === workerData.phone
    );

    if (isDuplicate) {
      throw new Error('A worker with this email or phone number already exists');
    }

    // Add new worker to the list
    const updatedWorkers = [...existingWorkers, newWorker];
    localStorage.setItem('workers', JSON.stringify(updatedWorkers));

    // Trigger a custom event for real-time updates
    window.dispatchEvent(new CustomEvent('workersUpdated', { 
      detail: { workers: updatedWorkers }
    }));

    return newWorker;
  } catch (error: any) {
    console.error('Error registering worker:', error);
    throw new Error(error.message || 'Failed to register worker. Please try again.');
  }
}

export async function getAllWorkers(): Promise<MigrantWorker[]> {
  try {
    const workers = JSON.parse(localStorage.getItem('workers') || '[]');
    return workers;
  } catch (error) {
    console.error('Error getting workers:', error);
    return [];
  }
}

export async function updateWorkerStatus(workerId: string, status: 'pending' | 'approved' | 'rejected'): Promise<MigrantWorker> {
  try {
    const workers = JSON.parse(localStorage.getItem('workers') || '[]');
    const workerIndex = workers.findIndex((w: MigrantWorker) => w.id === workerId);
    
    if (workerIndex === -1) {
      throw new Error('Worker not found');
    }

    workers[workerIndex] = {
      ...workers[workerIndex],
      status,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('workers', JSON.stringify(workers));

    // Trigger a custom event for real-time updates
    window.dispatchEvent(new CustomEvent('workersUpdated', { 
      detail: { workers }
    }));

    return workers[workerIndex];
  } catch (error: any) {
    console.error('Error updating worker status:', error);
    throw new Error(error.message || 'Failed to update worker status');
  }
} 