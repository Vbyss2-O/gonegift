import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project details
const supabaseUrl = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
// const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTM2MTYsImV4cCI6MjA1NTg2OTYxNn0.jcUCVUmUCTlvXhASODoeiPo5Gknk7pE2pYSDFrUTP9Q";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI5MzYxNiwiZXhwIjoyMDU1ODY5NjE2fQ.t-Mur1w6jwg3ykEFDlDiDpI2MzEBshOlimxkgrz54dw";

export const supabase = createClient(supabaseUrl, supabaseKey);
