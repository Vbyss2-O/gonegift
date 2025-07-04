package com.example.demo.Repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.Problem;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    // Additional query methods can be defined here if needed
    
}
