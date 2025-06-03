package com.example.demo.Controller.DeathControllers;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Service.FileMeataDataService;
import com.example.demo.model.DeathProject.DeathFiles;

@RestController
@RequestMapping("/api/filemetadata")
public class FileMetadataController {

    @Autowired
    private FileMeataDataService fileMetadataService;

    /**
     * Get file metadata by ID
     *
     * @param id The ID of the file metadata
     * @return ResponseEntity with the file metadata or an error status
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getFileMetadataById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return new ResponseEntity<>("Invalid file ID provided.", HttpStatus.BAD_REQUEST);
            }

            Optional<DeathFiles> fileMetadata = fileMetadataService.getFileMetadata(id);

            if (fileMetadata.isPresent()) {
                return ResponseEntity.ok(fileMetadata.get());
            } else {
                return new ResponseEntity<>("File metadata not found.", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("An unexpected error occurred.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    //This is tentive controller structure 
    
    @GetMapping("/getAllFiles/{userId}")
    public List<DeathFiles> getAllUserByID(@PathVariable UUID userId){
        // implement logic to get all files by specific user ID
        // return fileMetadataList;
        return fileMetadataService.getAllFilesBySpecifiUserId(userId);

    }

    /**
     * Save or update file metadata
     *
     * @param fileMetadata The file metadata to be saved or updated
     * @return ResponseEntity with the saved or updated file metadata
     */
    @PostMapping
    public ResponseEntity<?> saveOrUpdateFileMetadata(@RequestBody DeathFiles fileMetadata) {
        try {
            if (fileMetadata == null) {
                return new ResponseEntity<>("File metadata is required.", HttpStatus.BAD_REQUEST);
            }

            DeathFiles savedFileMetadata = fileMetadataService.saveOrUpdateFileMetaDataRepo(fileMetadata);
            return ResponseEntity.ok(savedFileMetadata);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("An unexpected error occurred while saving the metadata.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete file metadata by ID
     *
     * @param id The ID of the file metadata to delete
     * @return ResponseEntity with a success or error status
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFileMetadataById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return new ResponseEntity<>("Invalid file ID provided.", HttpStatus.BAD_REQUEST);
            }

            fileMetadataService.deleteFileMetaDataRepo(id);
            return new ResponseEntity<>("File metadata deleted successfully.", HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("An unexpected error occurred while deleting the metadata.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}