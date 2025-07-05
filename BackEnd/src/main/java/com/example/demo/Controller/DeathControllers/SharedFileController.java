package com.example.demo.Controller.DeathControllers;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Repo.SharedFileRepository;
import com.example.demo.Repo.SharedTokenRepository;
import com.example.demo.Service.SharedFileService;
import com.example.demo.model.DeathProject.SharedFile;
import com.example.demo.model.DeathProject.SharedToken;

@RestController
@RequestMapping("/shared-file")
public class SharedFileController {
    @Autowired
    private SharedFileService sharedFileService;

    @Autowired
    private SharedFileRepository sharedFileRepository;

    @Autowired
    private SharedTokenRepository sharedTokenRepository;



    @PostMapping("/add-file")
    public ResponseEntity<Void> addSharedFile(@RequestBody SharedFile file) {
        sharedFileRepository.save(file);
        return ResponseEntity.ok().build();
    }
    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteSharedFile(@RequestBody UUID authorId) {
        sharedFileService.delteAll(authorId);
        return ResponseEntity.ok().build();
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteSharedFileById(@PathVariable Long id) {
        sharedFileService.deleteSharedFile(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/verify")
    public ResponseEntity<Void> verifySharedFile(@RequestParam String token) {
        HttpHeaders headers = new HttpHeaders();

        if (token != null && sharedFileService.validateSharedFileToken(token)) {
            String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
            headers.setLocation(URI.create("http://localhost:5173/sharedSpace/upload/" + encodedToken));
        } else {
            headers.setLocation(URI.create("http://localhost:5173/ErrorPage"));
        }
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @GetMapping("/password/verify")
    public ResponseEntity<String> checkPasswordMatch(@RequestParam String token) {
       String spaceHashPass = sharedFileService.giveShapredFileHashPassword(token);
       
        return ResponseEntity.ok(spaceHashPass);
    }

    @GetMapping("/getAllFiles")
    public List<SharedFile> getAllFiles() {
        return sharedFileRepository.findAll();
    }

    @GetMapping("/getList")
    public List<SharedFile> getSpecificList(@RequestParam UUID authorId, @RequestParam String hash) {
        return sharedFileRepository.findByAuthorIdAndSpaceHashPass(authorId, hash);
    }

    @GetMapping("/totalSpaces/{authorId}")
    public Long getTotalSpaces(@PathVariable UUID authorId) {
        return sharedFileRepository.countDistinctSpacesByAuthor(authorId);
    }

    @PostMapping("/addToken")
    public ResponseEntity<Void> addToken(@RequestBody SharedToken data) {
        sharedTokenRepository.save(data);
        return ResponseEntity.ok().build();
    }

}
