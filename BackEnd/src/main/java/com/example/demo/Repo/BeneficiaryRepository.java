package com.example.demo.Repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.DeathProject.Beneficiary;

import jakarta.persistence.QueryHint;

@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {

    @Query("SELECT b FROM Beneficiary b WHERE b.userx.userIdX = :userIdX")
    @QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "true"))
    List<Beneficiary> findByUserIdX(@Param("userIdX") UUID userIdX);

}
