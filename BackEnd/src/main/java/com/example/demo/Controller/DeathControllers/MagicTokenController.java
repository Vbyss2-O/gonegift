package com.example.demo.Controller.DeathControllers;

import java.net.URI;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Service.DeathReportService;
import com.example.demo.Service.TokenService;
import com.example.demo.model.DeathProject.DeathUser;



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
    public ResponseEntity<Void> validateMagicLink(@RequestParam String token) {
         HttpHeaders headers = new HttpHeaders();
   
        if(token != null && magicTokenService.validateMagicToken(token)){
            headers.setLocation(URI.create("http://localhost:5173/ClaimAssets"));
        } else {
             headers.setLocation(URI.create("http://localhost:5173/ErrorPage"));
        }
        return new ResponseEntity<>(headers, HttpStatus.FOUND); // 302 Redirect
    }
    
}

