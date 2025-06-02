package com.example.demo.Repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.DeathFiles;

@Repository
public interface FileMetaDataRepo extends JpaRepository<DeathFiles , Long > {
    //create a method for to get 
    List<DeathFiles> findByIdOfUser(String userID);
}
