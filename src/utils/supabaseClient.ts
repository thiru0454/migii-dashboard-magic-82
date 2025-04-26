
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pwkuytkhpzuqzvljctiu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3V5dGtocHp1cXp2bGpjdGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzI3MjIsImV4cCI6MjA2MDYwODcyMn0.dyaWKhDzG8vTBNDUAEfAcv5ju8Wq5mca9HjnAO8Dr8U";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
