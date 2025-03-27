package com.example.demo.Repo;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.BuddyActivity;

import java.util.List;

@Repository
public interface BuddyActivityRepository extends JpaRepository<BuddyActivity, Long> {
    List<BuddyActivity> findByUserIdXOrderByTimestampAsc(String userIdX);
}
