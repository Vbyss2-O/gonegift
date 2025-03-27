package com.example.demo.Service;

import java.util.Base64;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
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
    public Optional<String> validateMagicToken(String encodedToken) {
        try {
            // Decode Base64 token
            byte[] decodedBytes = Base64.getDecoder().decode(encodedToken);
            String rawToken = new String(decodedBytes);

            // Fetch stored token from the database
            Optional<Token> storedToken =tokenRepository.findByHashtoken(encodedToken);

            // Validate token existence and check hash match
            if (storedToken.isEmpty() || !BCrypt.checkpw(rawToken, storedToken.get().getHashtoken())) {
                return Optional.empty(); // Invalid token
            }

            // Retrieve user ID and delete the token (one-time use)
            String userId = storedToken.get().getUserIDX();
            tokenRepository.delete(storedToken.get());

            return Optional.of(userId);
        } catch (IllegalArgumentException e) {
            return Optional.empty(); // Handle Base64 decoding errors
        } catch (Exception e) {
            e.printStackTrace(); // Log the error for debugging
            return Optional.empty(); // Handle other exceptions safely
        }
    }
    
    
}
