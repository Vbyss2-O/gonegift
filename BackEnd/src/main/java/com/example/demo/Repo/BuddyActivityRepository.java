package com.example.demo.Repo;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.BuddyActivity;

import java.util.List;
import java.util.UUID;

@Repository
public interface BuddyActivityRepository extends JpaRepository<BuddyActivity, Long> {
    List<BuddyActivity> findByUserIdXOrderByTimestampAsc(UUID userIdX);
}
