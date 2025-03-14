package com.example.demo.Controller.DeathControllers;

import com.example.demo.Service.DeathUserService;
import com.example.demo.model.DeathProject.DeathUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;


@RestController
@RequestMapping("/api/deathusers")
public class DeathUserController {

    @Autowired
    private DeathUserService deathUserService;

    @PostMapping
    public String createOrUpdateUser(@RequestBody DeathUser user) {
        //create a unique user uuid for deathuser secreteKey
       
        deathUserService.saveOrUpdateUser(user);
        return "User created successfully";
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeathUser> getUserById(@PathVariable String id) {
        Optional<DeathUser> user = deathUserService.getUserById(id);
        return user.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                   .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserById(@PathVariable String id) {
        try {
            deathUserService.deleteUserById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 204 No Content on success
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // 404 if user not found
        }
    }

    @GetMapping
    public ResponseEntity<Iterable<DeathUser>> getAllUsers() {
        Iterable<DeathUser> users = deathUserService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK); // 200 OK
    }
    
    // here i am adding the two get request methods for checking the size of the files and benificary
    @GetMapping("/filesize/{id}")
    public int getFileSize(@PathVariable String id) {
        return deathUserService.getFileSize(id);
    }
   @GetMapping("/beneficiarysize/{id}")
    public int getBeneficiarySize(@PathVariable String id) {
        return deathUserService.getSizeOfBeneficiary(id);
    }
    
    
}