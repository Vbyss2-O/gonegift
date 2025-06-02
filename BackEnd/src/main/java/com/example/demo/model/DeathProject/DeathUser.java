package com.example.demo.model.DeathProject;

import java.time.LocalDateTime;
import java.util.List;
//in production i will make all column as the not null currelty skip not null constraint
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
// import jakarta.persistence.CascadeType;
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
    @Column(nullable = false)
    private String userIdX;

    @Column(nullable = false , unique = true)
    private String email;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastname ;
    
    @Column(nullable = false)
    private LocalDateTime lastActivityDate;

    @Column(nullable = false)
    private Integer inactivityThresholdDays;
    
   //here i am going to store encrypted AES key at all
    private String secretKey;

    @Column(nullable = false)
    private String userRole;
    //this hashtoken will be in use when we are verfity the uuid of the user
    @Column(nullable = false)
    private String hashuuid;
    //colum should not be null  
    @Column(nullable = false)
    private boolean isdeceased; 

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    // @Column(nullable = false)
    private BuddyStatus buddyStatus = BuddyStatus.CHILLING; 

    @Column(nullable = false)
    private Integer attemptCount;

    private LocalDateTime nextBuddyDate;

    private LocalDateTime lastInteraction;
    

    // corrected the mapping for beneficiaries
    @OneToMany(mappedBy = "userx"  ,fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true) 
    @JsonManagedReference
    private List<Beneficiary> beneficiaries;

    // Corrected the mapping for files
    @OneToMany(mappedBy = "usery" , fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference 
    private List<DeathFiles> files;
}

