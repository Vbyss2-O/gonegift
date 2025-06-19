import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project details
const supabaseUrl =  import.meta.env.VITE_SUPABASE_URL;

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
