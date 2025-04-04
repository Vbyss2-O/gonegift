package com.example.demo.model.DeathProject;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "death_reports")
@Data
public class DeathReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;
    
    @Column(nullable = false)
    private String secretId;
    
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String surname;

    @Column(nullable = false)
    private String reportDetails;
    
    @Column(nullable = false)
    private String status = "pending";

   
}