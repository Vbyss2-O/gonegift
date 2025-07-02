package com.example.demo.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.Repo.FileMetaDataRepo;
import com.example.demo.model.DeathProject.DeathFiles;
import com.example.demo.model.DeathProject.DeathUser;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.cache.annotation.CachePut;
// import jakarta.persistence.Cacheable;

@Service
public class FileMeataDataService {

    @Autowired
    private FileMetaDataRepo fileMetaDataRepo;

    public DeathFiles saveOrUpdateFileMetaDataRepo(DeathFiles deathfile) {
        return fileMetaDataRepo.save(deathfile);
    }

    // delete file meta data
    @Transactional
    public void deleteFileMetaDataRepo(Long id) {
         DeathFiles fileToDelete = fileMetaDataRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("File not found with id: " + id));

        // 2. Get the parent entity.
        DeathUser parentUser = fileToDelete.getUsery();

        // 3. **THE CRITICAL STEP**: Remove the child from the parent's collection.
        // This makes the in-memory state consistent.
        // This now works correctly because you fixed equals() and hashCode() in Step 1.
        if (parentUser != null) {
            parentUser.getFiles().remove(fileToDelete);
        }

        // 4. Now, you can safely delete the child entity.
        // There is no longer a conflict, and Hibernate will issue the DELETE statement.
        fileMetaDataRepo.delete(fileToDelete);
    }

    public Optional<DeathFiles> getFileMetadata(Long fileId) {

        return fileMetaDataRepo.findById(fileId);
    }
    // i have to query the user according to the username
    // @CachePut("deathFilesByUser")
    public List<DeathFiles> getAllFilesBySpecifiUserId(UUID userID) {
        // find all users with spercific userId
        return fileMetaDataRepo.findByIdOfUser(userID);
    }

}
