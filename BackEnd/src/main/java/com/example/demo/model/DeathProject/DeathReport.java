package com.example.demo.model.DeathProject;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "death_reports")
@Data
public class DeathReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    
    private String secretId;
    
    private String name;
    private String surname;
    
    private String reportDetails;
    
    
    private String status = "pending";

    // @ManyToOne
    // @JoinColumn(name = "beneficiary_id", nullable = false)
    // private Beneficiary beneficiary; // Many-to-one mapping with Beneficiary
}