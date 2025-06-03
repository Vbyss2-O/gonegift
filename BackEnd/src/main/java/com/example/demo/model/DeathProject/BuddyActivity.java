package com.example.demo.model.DeathProject;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;



@Entity
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class BuddyActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long activityId;

    @Column(nullable = false)
    private UUID userIdX; // Changed to String to match DeathUser's PK

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(nullable = false)
    private String action;

    

}
