package com.example.demo.Service;

import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class SupabaseService {

    private static final Logger logger = LoggerFactory.getLogger(SupabaseService.class);
    private final OkHttpClient client;
    private final String supabaseUrl;
    private final String supabaseKey;

    // Injecting Beans from SupabaseConfig
    public SupabaseService(OkHttpClient client, String supabaseUrl, String supabaseKey) {
        this.client = client;
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
    }

    public String uploadFile(String bucket, String filePath, byte[] fileData, String mimeType) throws Exception {
        // Input validation
        if (bucket == null || bucket.trim().isEmpty()) {
            throw new IllegalArgumentException("Bucket name cannot be null or empty");
        }
        if (filePath == null || filePath.trim().isEmpty()) {
            throw new IllegalArgumentException("File path cannot be null or empty");
        }
        if (fileData == null || fileData.length == 0) {
            throw new IllegalArgumentException("File data cannot be null or empty");
        }
        if (mimeType == null || mimeType.trim().isEmpty()) {
            throw new IllegalArgumentException("MIME type cannot be null or empty");
        }

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + filePath;
        logger.debug("Uploading file to Supabase: {}", uploadUrl);

        RequestBody requestBody = RequestBody.create(fileData, MediaType.parse(mimeType));
        Request request = new Request.Builder()
                .url(uploadUrl)
                .addHeader("Authorization", "Bearer " + supabaseKey)
                .addHeader("Content-Type", mimeType)
                .put(requestBody)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String responseBody = response.body() != null ? response.body().string() : "No response body";
                logger.error("Supabase upload failed: HTTP {} - {}, Response: {}", 
                    response.code(), response.message(), responseBody);
                throw new Exception("Failed to upload to Supabase: HTTP " + response.code() + 
                    " - " + response.message() + ", Details: " + responseBody);
            }
            logger.info("File uploaded successfully to: {}", uploadUrl);
        } catch (IOException e) {
            logger.error("IO error during Supabase upload: {}", e.getMessage(), e);
            throw new Exception("Failed to upload to Supabase due to IO error: " + e.getMessage(), e);
        }

        // Returning public URL for uploaded file
        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + filePath;
        logger.debug("Generated public URL: {}", publicUrl);
        return publicUrl;
    }
}