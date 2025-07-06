package com.example.demo.Repo;

import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.SharedFile;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface SharedFileRepository extends JpaRepository<SharedFile, Long> {
    

    List<SharedFile> findByAuthorIdAndSpaceHashPass(UUID authorId, String spaceHashPass);

    @Query("SELECT COUNT(DISTINCT sf.spaceHashPass) FROM SharedFile sf WHERE sf.authorId = :authorId")
    Long countDistinctSpacesByAuthor(@Param("authorId") UUID authorId);

    List<SharedFile> findByAuthorId(UUID authorId);
     
}
