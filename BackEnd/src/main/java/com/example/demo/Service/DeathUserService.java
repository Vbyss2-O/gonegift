package com.example.demo.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.model.DeathProject.Beneficiary;
import com.example.demo.model.DeathProject.DeathFiles;
import com.example.demo.model.DeathProject.DeathUser;

import java.util.List;
import java.util.Optional;

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

    public Optional<DeathUser> getUserById(String id) {
        return deathUserRepository.findById(id);
    }

    // Delete a DeathUser by ID
    public void deleteUserById(String id) {
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
    public int getFileSize(String id) {
       DeathUser user = deathUserRepository.findById(id).orElse(null);
       if (user != null) {
           return user.getFiles().size();
       } else {
           throw new RuntimeException("User not found with ID: " + id);
       }
    }
    public int getSizeOfBeneficiary(String id) {
        DeathUser user = deathUserRepository.findById(id).orElse(null);
        if (user != null) {
            return user.getBeneficiaries().size();
        } else {
            throw new RuntimeException("User not found with ID: " + id);
        }
    }

    // list of all 
    public List<Beneficiary> getBeneficiaryList(String id) {
        DeathUser user = deathUserRepository.findById(id).orElse(null);
        if (user != null) {
            return user.getBeneficiaries();
        } else {
            throw new RuntimeException("User not found with ID: " + id);
        }
    }
    public List<DeathFiles> getFileList(String id) {
        DeathUser user = deathUserRepository.findById(id).orElse(null);
        if (user!= null) {
            return user.getFiles();
        } else {
            throw new RuntimeException("User not found with ID: " + id);
        }
    }
    public void storeSecretKey(String serectID , String userID){
        DeathUser user = deathUserRepository.findById(userID).orElse(null);
        if (user!= null) {
            user.setSecretKey(serectID);
            deathUserRepository.save(user);
        } else {
            throw new RuntimeException("User not found with ID: " + userID);
        }
    }
    public void storeHashToken(String userID , String hashuuid){
        DeathUser user = deathUserRepository.findById(userID).orElse(null);
        if (user!= null) {
            user.setHashuuid(hashuuid);
            deathUserRepository.save(user);
        }
        else {
            throw new RuntimeException("User not found with ID: " + userID);
        }

    }
    public boolean findByHashuuidEquals(String hashtoken , String userid){
       
        
        DeathUser user = deathUserRepository.findById(userid).orElse(null);
        if (user!= null) {
            return user.getHashuuid().equals(hashtoken);
            }
           return false;
                
    }
    
}