package com.example.demo.Controller.DeathControllers;

import com.example.demo.Service.DeathUserService;
import com.example.demo.model.DeathProject.Beneficiary;
import com.example.demo.model.DeathProject.DeathFiles;
import com.example.demo.model.DeathProject.DeathUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    //below two get controller is for the showing the list of proper benificaries and files 
    @GetMapping("/listOfBeneficiary/{id}")
    public List<Beneficiary> getBeneficiaryList(@PathVariable String id) {
        return deathUserService.getBeneficiaryList(id);
    }
    @GetMapping("/listOfFiles/{id}")
    public List<DeathFiles> getFileList(@PathVariable String id) {
        return deathUserService.getFileList(id);
    }
    @PostMapping("/storeSecretKey/{useruid}")
    public void storeSerectKey(@RequestBody String id, @PathVariable String useruid) {
        deathUserService.storeSecretKey(id , useruid);
    }
    //this is for getting the aes encrypted key
    @GetMapping("/getKey/{userid}")
    public String getKey(@PathVariable String userid) {
        return deathUserService.findUserBySecretId(userid).getSecretKey();
        
    }
    @PostMapping("/sendSecretKey/{useruid}")
    public void storeSecretKey(@PathVariable String useruid , @RequestBody String encryptedAesKey) {
        deathUserService.storeSecretKey(encryptedAesKey , useruid);
    }  
    @PostMapping("/sendHashToken/{useruid}")
    public void storeHashToken(@PathVariable String useruid , @RequestBody String hashToken) {
        deathUserService.storeSecretKey(useruid , hashToken);
    } 
    @GetMapping("/findHashToken")
    public ResponseEntity<Void> validateHashuuid(@RequestBody String hashuuid , @RequestBody String userid){
        if(deathUserService.findByHashuuidEquals(hashuuid , userid)){
            return ResponseEntity.ok().build();
        }
        else{
            return ResponseEntity.notFound().build();
        }

    } 
}