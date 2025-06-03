package com.example.demo.Controller.DeathControllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Service.DeathReportService;
import com.example.demo.Service.TokenService;
import com.example.demo.model.DeathProject.DeathUser;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/magic-link")
public class MagicTokenController {
    @Autowired
    private  TokenService magicTokenService;

    @Autowired
    private DeathReportService deathReportService ;

    

    @PostMapping("/generate")
    public ResponseEntity<String> sendMagicLink(@RequestBody DeathUser deathUser) {
        deathReportService.triggerUser(deathUser);
        return ResponseEntity.ok("Magic link sent!");
    }

    @GetMapping("/retrieve")
    public ResponseEntity<String> validateMagicLink(@RequestParam String token) {
        Optional<UUID> userId = magicTokenService.validateMagicToken(token);
        return userId.map(uuid -> ResponseEntity.ok(uuid.toString()))
                     .orElseGet(() -> ResponseEntity.status(401).body("Invalid or expired link"));
    }
    
}

