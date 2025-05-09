import { supabase } from './supabase';

export interface WorkerSkill {
  id: string;
  skill_name: string;
}

export interface WorkerRating {
  id: string;
  rating: number;
}

export const addWorkerSkill = async (workerId: string, skillName: string) => {
  const { data, error } = await supabase
    .from('worker_skills')
    .insert([{ worker_id: workerId, skill_name: skillName }])
    .select();

  if (error) throw error;
  return data;
};

export const removeWorkerSkill = async (workerId: string, skillName: string) => {
  const { error } = await supabase
    .from('worker_skills')
    .delete()
    .match({ worker_id: workerId, skill_name: skillName });

  if (error) throw error;
};

export const getWorkerSkills = async (workerId: string) => {
  const { data, error } = await supabase
    .from('worker_skills')
    .select('*')
    .eq('worker_id', workerId);

  if (error) throw error;
  return data as WorkerSkill[];
};

export const addWorkerRating = async (workerId: string, rating: number) => {
  const { data, error } = await supabase
    .from('worker_ratings')
    .insert([{ worker_id: workerId, rating }])
    .select();

  if (error) throw error;
  return data;
};

export const getWorkerAverageRating = async (workerId: string) => {
  const { data, error } = await supabase
    .from('worker_ratings')
    .select('rating')
    .eq('worker_id', workerId);

  if (error) throw error;
  
  if (!data.length) return 0;
  
  const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
  return sum / data.length;
}; 