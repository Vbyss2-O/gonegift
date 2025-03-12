package com.example.demo.model.DeathProject;

import com.fasterxml.jackson.annotation.JsonBackReference;

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
public class Beneficiary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String idOfUser;
    private String name;
    private String email;

    // Implementing Many-to-One mapping correctly
    @ManyToOne
    @JoinColumn(name = "relative_id", nullable = false)
    @JsonBackReference // Changed relative_id to user_id to match the reference in DeathUser
    private DeathUser userx; // This references the DeathUser entity




}
