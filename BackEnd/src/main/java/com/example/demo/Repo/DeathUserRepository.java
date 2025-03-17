package com.example.demo.Repo;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.DeathUser;

@Repository
public interface DeathUserRepository extends JpaRepository<DeathUser, String> {
    //query the user on basic of the secrect id 
    DeathUser findBySecretKey(String secretKey);

    List<DeathUser> findByNextBuddyDateBefore(LocalDateTime now);
    
}
