package com.example.demo.Service;

import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.IvParameterSpec;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.io.IOException;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

@Service
public class SupabaseService {

    private static final Logger logger = LoggerFactory.getLogger(SupabaseService.class);
    private final OkHttpClient client;
    private final String supabaseUrl;
    private final String supabaseKey;
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";

    // Injecting Beans from SupabaseConfig
    public SupabaseService(OkHttpClient client, String supabaseUrl, String supabaseKey) {
        this.client = client;
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
    }
    
    public static String generateKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance("AES");
            keyGen.init(256); // Specify 256 bits for AES-256
            SecretKey secretKey = keyGen.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate AES key", e);
        }
    }
    //here i am storing the key securly it will give the key as it is only sotres it securlriy
    public static String getEncryptionKey() {
        SecretsManagerClient client = SecretsManagerClient.builder().region(Region.US_EAST_1).build();
        GetSecretValueRequest request = GetSecretValueRequest.builder().secretId(generateKey()).build();
        GetSecretValueResponse response = client.getSecretValue(request);
        return response.secretString();
    }

    private byte[] encrypt(byte[] fileData) throws Exception {
        // Decode the Base64 encoded key back to raw bytes
        byte[] keyBytes = Base64.getDecoder().decode(getEncryptionKey());
        SecretKey secretKey = new SecretKeySpec(keyBytes, "AES");
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        
        // Generate random IV
        byte[] iv = new byte[16];
        new SecureRandom().nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);
        byte[] encryptedData = cipher.doFinal(fileData);

        // Combine IV and encrypted data
        byte[] combined = new byte[iv.length + encryptedData.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encryptedData, 0, combined, iv.length, encryptedData.length);

        return combined;
    }

    private byte[] decrypt(byte[] encryptedData) throws Exception {
        // Extract IV from the first 16 bytes
        byte[] iv = new byte[16];
        byte[] actualData = new byte[encryptedData.length - 16];
        System.arraycopy(encryptedData, 0, iv, 0, 16);
        System.arraycopy(encryptedData, 16, actualData, 0, actualData.length);

        // Decode the Base64 encoded key back to raw bytes
        byte[] keyBytes = Base64.getDecoder().decode(getEncryptionKey());
        SecretKey secretKey = new SecretKeySpec(keyBytes, "AES");
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
        return cipher.doFinal(actualData);
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

        // Encrypt the file data
        byte[] encryptedData = encrypt(fileData);
        logger.debug("File encrypted successfully, size: {} bytes", encryptedData.length);

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + filePath;
        logger.debug("Uploading encrypted file to Supabase: {}", uploadUrl);

        RequestBody requestBody = RequestBody.create(encryptedData, MediaType.parse(mimeType));
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
            logger.info("Encrypted file uploaded successfully to: {}", uploadUrl);
        } catch (IOException e) {
            logger.error("IO error during Supabase upload: {}", e.getMessage(), e);
            throw new Exception("Failed to upload to Supabase due to IO error: " + e.getMessage(), e);
        }

        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + filePath;
        logger.debug("Generated public URL for encrypted file: {}", publicUrl);
        return publicUrl;
    }

    // Method to download and decrypt file
    public byte[] downloadAndDecryptFile(String url) throws Exception {
        Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + supabaseKey)
                .get()
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new Exception("Failed to download file: " + response.code());
            }

            byte[] encryptedData = response.body().bytes();
            return decrypt(encryptedData);
        }
    }
}