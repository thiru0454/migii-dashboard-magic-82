import React, { useEffect, useState } from 'react';
import { WorkerAssignment } from './WorkerAssignment';
import { getWorkerSkills, getWorkerAverageRating } from '@/lib/worker-utils';
import { toast } from 'react-hot-toast';

export const TestWorkerAssignment = () => {
  const [workerSkills, setWorkerSkills] = useState<string[]>([]);
  const [workerRating, setWorkerRating] = useState<number>(0);
  const workerId = '40c8a7e5-765d-4512-9399-a823af8fad2f';

  useEffect(() => {
    const loadWorkerData = async () => {
      try {
        const skills = await getWorkerSkills(workerId);
        const rating = await getWorkerAverageRating(workerId);
        
        setWorkerSkills(skills.map(s => s.skill_name));
        setWorkerRating(rating);
      } catch (error) {
        console.error('Error loading worker data:', error);
        toast.error('Failed to load worker data');
      }
    };

    loadWorkerData();
  }, [workerId]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Worker Profile</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-lg mb-2">Skills: {workerSkills.join(', ')}</p>
          <p className="text-lg">Average Rating: {workerRating.toFixed(1)}/5</p>
        </div>
      </div>

      <WorkerAssignment />
    </div>
  );
}; 