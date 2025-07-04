package com.example.demo.Service;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.Repo.SharedFileRepository;
import com.example.demo.Repo.SharedTokenRepository;
import com.example.demo.model.DeathProject.DeathUser;
import com.example.demo.model.DeathProject.SharedFile;
import com.example.demo.model.DeathProject.SharedToken;

import jakarta.persistence.EntityNotFoundException;

@Service
public class SharedFileService {
    @Autowired
    private SharedTokenRepository sharedTokenRepository;

    @Autowired
    private SharedFileRepository sharedFileRepository;

    @Autowired
    private DeathUserRepository deathUserRepository;

    public boolean validateSharedFileToken(String token) {
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

    public void deleteSharedFile(Long id) {
        SharedFile sharedFileTODelete = sharedFileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shared file not found with id: " + id));

        DeathUser parentUser = sharedFileTODelete.getUserz();
        if (parentUser != null) {
            parentUser.getSharedfiles().remove(sharedFileTODelete);
        }
        sharedFileRepository.delete(sharedFileTODelete);

    }

    public void delteAll(UUID userId) {
        sharedFileRepository.deleteAll();
        DeathUser user = deathUserRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        if (user.getSharedfiles() != null) {
            user.getSharedfiles().clear(); // Clear the user's shared files
        }

    }
}
