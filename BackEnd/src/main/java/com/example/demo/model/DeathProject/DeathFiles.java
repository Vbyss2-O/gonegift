package com.example.demo.model.DeathProject;

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
public class DeathFiles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;
     
    @Column(nullable = false)
    private String idOfUser;

    private String letterFileUrl;

    private String mediaFileUrl;

    @ManyToOne
    @JoinColumn(name = "file_id", nullable = false)
    @JsonBackReference // Changed file_id to user_id to match the reference in DeathUser
    private DeathUser usery; // This references the DeathUser entity

}
