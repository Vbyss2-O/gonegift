package com.example.demo.Repo;


import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.DeathProject.DeathReport;

import java.util.List;

public interface DeathReportRepository extends JpaRepository<DeathReport, Long> {
    List<DeathReport> findByStatus(String status);
    
}
