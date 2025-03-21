package com.example.demo.Controller.DeathControllers;

import com.example.demo.Service.DeathUserService;
import com.example.demo.Service.FileMeataDataService;
import com.example.demo.Service.SupabaseService;
import com.example.demo.model.DeathProject.DeathFiles;
import com.example.demo.model.DeathProject.DeathUser;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/files")
public class FileMetadataController {

    @Autowired
    private DeathUserService deathUserService;
    private static final Logger logger = LoggerFactory.getLogger(FileMetadataController.class);

    private final SupabaseService supabaseService;
    private final FileMeataDataService fileMetadataService;

    @Autowired
    public FileMetadataController(SupabaseService supabaseService, FileMeataDataService fileMetadataService) {
        this.supabaseService = supabaseService;
        this.fileMetadataService = fileMetadataService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("idOfUser") String idOfUser) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        try {
            logger.info("Starting file upload for user: {}", idOfUser);
            
            // Determine bucket and upload file
            String bucket = determineBucket(file.getContentType());
            String uniqueFileName = idOfUser + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            String filePath = idOfUser + "/" + uniqueFileName;

            // Upload to Supabase
            String fileUrl = supabaseService.uploadFile(bucket, filePath, file.getBytes(), file.getContentType());
            
            // Create and save file metadata
            DeathFiles deathFiles = new DeathFiles();
            DeathUser user = deathUserService.getUserById(idOfUser)
    .orElseThrow(() -> new RuntimeException("User not found with ID: " + idOfUser));
            deathFiles.setUsery(user);
            deathFiles.setIdOfUser(idOfUser);
            if (bucket.equals("letters")) {
                deathFiles.setLetterFileUrl(fileUrl);
            } else {
                deathFiles.setMediaFileUrl(fileUrl);
            }

            // Save metadata to database
            DeathFiles savedFileMetadata = fileMetadataService.saveOrUpdateFileMetaDataRepo(deathFiles);
            logger.info("File metadata saved successfully: {}", savedFileMetadata);

            return ResponseEntity.ok(savedFileMetadata);

        } catch (Exception e) {
            logger.error("Error during file upload: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing file upload: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFileMetadataById(@PathVariable Long id) {
        try {
            Optional<DeathFiles> fileMetadata = fileMetadataService.getFileMetadata(id);
            return fileMetadata
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching file metadata: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching file metadata: " + e.getMessage());
        }
    }

    @GetMapping("/getAllFiles/{userId}")
    public ResponseEntity<List<DeathFiles>> getAllUserFiles(@PathVariable String userId) {
        try {
            List<DeathFiles> files = fileMetadataService.getAllFilesBySpecifiUserId(userId);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            logger.error("Error fetching user files: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFileMetadata(@PathVariable Long id) {
        try {
            fileMetadataService.deleteFileMetaDataRepo(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting file metadata: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting file metadata: " + e.getMessage());
        }
    }

    private String determineBucket(String contentType) {
        if (contentType != null && (contentType.startsWith("image") || contentType.startsWith("video"))) {
            return "media";
        }
        return "letters";
    }
}