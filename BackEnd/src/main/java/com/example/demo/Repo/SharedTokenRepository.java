package com.example.demo.Repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.SharedToken;

@Repository
public interface SharedTokenRepository extends JpaRepository<SharedToken, Long> {
     Optional<SharedToken> findByToken(String token);

}
