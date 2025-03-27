package com.example.demo.Repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.Token;

@Repository
public interface TokenRepository extends JpaRepository<Token , Long>{

    // Optional<Token> findValidToken(); find token with the speicific string hased token okay 
    Optional<Token> findByHashtoken(String encodedToken);
    
}
