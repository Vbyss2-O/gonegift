package com.example.demo.Repo;


import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.DeathProject.BuddyActivity;

import java.util.List;

public interface BuddyActivityRepository extends JpaRepository<BuddyActivity, Long> {
    List<BuddyActivity> findByUserIdXOrderByTimestampAsc(String userIdX);
}
