package com.example.demo.model.DeathProject;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Data
@Setter
@EqualsAndHashCode
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class DeathUser {

    @Id
    private String userIdX;
    private String email;
    private String firstName;
    private String lastname ;

    private LocalDateTime lastActivityDate;
    private Integer inactivityThresholdDays;
    
    // Added relativeId field as per your previous code 
    private String relativeId; // Adjust type if needed
    private String secretKey;
    private String userRole;
    //colum should not be null  
    @Column(nullable = false)
    private boolean isdeceased; 

    @Enumerated(EnumType.STRING)
    // @Column(nullable = false)
    private BuddyStatus buddyStatus = BuddyStatus.CHILLING; 

    
    private Integer attemptCount;

    private LocalDateTime nextBuddyDate;
    private LocalDateTime lastInteraction;
    

    // corrected the mapping for beneficiaries
    @OneToMany(mappedBy = "userx" , fetch = FetchType.EAGER) 
    @JsonManagedReference
    private List<Beneficiary> beneficiaries;

    // Corrected the mapping for files
    @OneToMany(mappedBy = "usery" , fetch = FetchType.EAGER)
    @JsonManagedReference 
    private List<DeathFiles> files;
}

