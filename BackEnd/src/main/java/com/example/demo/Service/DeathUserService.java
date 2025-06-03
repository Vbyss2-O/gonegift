package com.example.demo.Service;

import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.cache.annotation.CachePut;
// import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.model.DeathProject.Beneficiary;
import com.example.demo.model.DeathProject.DeathFiles;
import com.example.demo.model.DeathProject.DeathUser;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DeathUserService {

    @Autowired
    private DeathUserRepository deathUserRepository;

    // Create or update a DeathUser
    public DeathUser saveOrUpdateUser(DeathUser user) {
        DeathUser existingUser = deathUserRepository.findById(user.getUserIdX()).orElse(null);
        if (existingUser != null && "admin".equals(existingUser.getUserRole())) {
            // Preserve admin role if already set
            user.setUserRole("admin");
        } else if (user.getUserRole() == null) {
            // Default to general if no role provided and not admin
            user.setUserRole("general");
        }
        return deathUserRepository.save(user);
    }

    // Fetch a DeathUser by ID
    public List<DeathUser> getAllUser() {
        return deathUserRepository.findAll();
    }

    public Optional<DeathUser> getUserById(UUID id) {
        return deathUserRepository.findById(id);
    }

    // Delete a DeathUser by ID
    public void deleteUserById(UUID id) {
        if (deathUserRepository.existsById(id)) {
            deathUserRepository.deleteById(id);
        } else {
            throw new RuntimeException("User not found with ID: " + id);
        }
    }

    // List all DeathUsers
    public Iterable<DeathUser> getAllUsers() {
        return deathUserRepository.findAll();
    }
    public DeathUser findUserBySecretId(String secretId) {
        return deathUserRepository.findBySecretKey(secretId);
    }
    //------------------------
    //this not makes any sense
    // @CachePut(value = "filesize", key = "#id")
    public int getFileSize(UUID id) {
       DeathUser user = deathUserRepository.findById(id).orElse(null);
       if (user != null) {
           return user.getFiles().size();
       } else {
           throw new RuntimeException("User not found with ID: " + id);
       }
    }
    // @CachePut(value = "beneficiarySize", key = "#id")
    public int getSizeOfBeneficiary(UUID id) {
        DeathUser user = deathUserRepository.findById(id).orElse(null);
        if (user != null) {
            return user.getBeneficiaries().size();
        } else {
            throw new RuntimeException("User not found with ID: " + id);
        }
    }

    // list of all 
    public List<Beneficiary> getBeneficiaryList(UUID id) {
        DeathUser user = deathUserRepository.findById(id).orElse(null);
        if (user != null) {
            return user.getBeneficiaries();
        } else {
            throw new RuntimeException("User not found with ID: " + id);
        }
    }
    public List<DeathFiles> getFileList(UUID id) {
        DeathUser user = deathUserRepository.findById(id).orElse(null);
        if (user!= null) {
            return user.getFiles();
        } else {
            throw new RuntimeException("User not found with ID: " + id);
        }
    }
    public void storeSecretKey(String serectID , UUID userID){
        DeathUser user = deathUserRepository.findById(userID).orElse(null);
        if (user!= null) {
            user.setSecretKey(serectID);
            deathUserRepository.save(user);
        } else {
            throw new RuntimeException("User not found with ID: " + userID);
        }
    }
    public void storeHashToken(UUID userID , String hashuuid){
        DeathUser user = deathUserRepository.findById(userID).orElse(null);
        if (user!= null) {
            user.setHashuuid(hashuuid);
            deathUserRepository.save(user);
        }
        else {
            throw new RuntimeException("User not found with ID: " + userID);
        }

    }
    public boolean findByHashuuidEquals(String hashtoken , UUID userid){
       
        
        DeathUser user = deathUserRepository.findById(userid).orElse(null);
        if (user!= null) {
            return user.getHashuuid().equals(hashtoken);
            }
           return false;
                
    }
    
}