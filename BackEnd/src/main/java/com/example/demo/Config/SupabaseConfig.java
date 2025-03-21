package com.example.demo.Config;


import okhttp3.OkHttpClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SupabaseConfig {

    private static final String SUPABASE_URL = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
    //here i used the secrect key to bypass the RLS
    private static final String SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI5MzYxNiwiZXhwIjoyMDU1ODY5NjE2fQ.t-Mur1w6jwg3ykEFDlDiDpI2MzEBshOlimxkgrz54dw"; // Use service role key for write access


    @Bean
    public OkHttpClient supabaseClient() {
        return new OkHttpClient.Builder().build();
    }

    @Bean
    public String supabaseUrl() {
        return SUPABASE_URL;
    }

    @Bean
    public String supabaseKey() {
        return SUPABASE_KEY;
    }
}

