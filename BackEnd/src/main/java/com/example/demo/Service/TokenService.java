package com.example.demo.Service;

import java.util.Base64;
import java.util.Optional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.TokenRepository;
import com.example.demo.model.DeathProject.Token;

@Service
public class TokenService {

    @Autowired
    private TokenRepository tokenRepository;

    public void storeToken(Token token) {
        tokenRepository.save(token);
    }

    public boolean validateMagicToken(String encodedToken) {
        try {
            // Decode URL-safe Base64 token
            byte[] decodedBytes = Base64.getUrlDecoder().decode(encodedToken);
            String rawToken = new String(decodedBytes, StandardCharsets.UTF_8);

            // Hash the raw token with SHA-256
            String hashedToken = hashToken(rawToken);

            // Find the stored token by hashed token
            Optional<Token> storedTokenOpt = tokenRepository.findByHashtoken(hashedToken);
            if (storedTokenOpt.isEmpty()) {
                return false; // No such token
            }

            Token storedToken = storedTokenOpt.get();

            // Check if token is expired
            if (storedToken.getExpirydate().isBefore(LocalDate.now())) {
                tokenRepository.delete(storedToken); // Clean up expired token
                return false;
            }

            return true; // Token is valid
        } catch (IllegalArgumentException e) {
            System.err.println("Base64 decoding failed: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.err.println("Token validation failed: " + e.getMessage());
            return false;
        }
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash).toLowerCase(); // Convert to hex string
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed: " + e.getMessage());
        }
    }

}
