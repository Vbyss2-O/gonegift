package com.example.demo.Service;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.SharedTokenRepository;
import com.example.demo.model.DeathProject.SharedToken;

@Service
public class SharedFileService {
    @Autowired
    private SharedTokenRepository sharedTokenRepository;

    public boolean validateSharedFileToken(String token){
     Optional<SharedToken> tokenx = sharedTokenRepository.findByToken(token);
     if (tokenx.isPresent()) {
     SharedToken sharedToken = tokenx.get();

      if (sharedToken.getExpirydate().isBefore(LocalDate.now())) {
                sharedTokenRepository.delete(sharedToken); // Clean up expired token
                return false;
        }
    }
        return true;

    }
}
