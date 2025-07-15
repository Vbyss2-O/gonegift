package com.example.demo.model.DeathProject;

import java.util.UUID;


import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
// @Cacheable
// @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class SharedFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;
    @Column(nullable = false)
    private UUID authorId;
    @Column(nullable = false)
    private UUID uploaderId;
    @Column(nullable = false)
    private String token;
    @Column(nullable = false)
    private String spaceHashPass;
    @Column(nullable = false)
    private String uploadFileUrl;
    @Column(nullable = false)
    private String fileName; 

    @ManyToOne
    @JoinColumn(name = "userid",referencedColumnName ="userIDX", nullable = false)
    @JsonBackReference 
    private DeathUser userz; 
    

}
