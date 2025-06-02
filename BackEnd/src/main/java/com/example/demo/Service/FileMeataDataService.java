package com.example.demo.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.FileMetaDataRepo;
import com.example.demo.model.DeathProject.DeathFiles;

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
    public void deleteFileMetaDataRepo(Long id) {
        fileMetaDataRepo.deleteById(id);
    }

    public Optional<DeathFiles> getFileMetadata(Long fileId) {

        return fileMetaDataRepo.findById(fileId);
    }
    // i have to query the user according to the username
    @CachePut("deathFilesByUser")
    public List<DeathFiles> getAllFilesBySpecifiUserId(String userID) {
        // find all users with spercific userId
        return fileMetaDataRepo.findByIdOfUser(userID);
    }

}
