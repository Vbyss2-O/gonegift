package com.example.demo.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.BeneficiaryRepository;
import com.example.demo.model.DeathProject.Beneficiary;

import java.util.List;
import java.util.Optional;

@Service
public class BeneficiaryService {

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    // Save or Update Beneficiary
    public Beneficiary saveOrUpdate(Beneficiary beneficiary) {
        try {
            return beneficiaryRepository.save(beneficiary);
        } catch (Exception e) {
            // Log the exception and throw a custom error
            System.err.println("Error saving or updating beneficiary: " + e.getMessage());
            throw new RuntimeException("Failed to save or update beneficiary.");
        }
    }

    // Get Beneficiary by ID
    @Cacheable(value = "beneficiaries", key = "#id")
    public Optional<Beneficiary> getBeneficiaryById(Long id) {
        try {
            return beneficiaryRepository.findById(id);
        } catch (Exception e) {
            // Log the exception and throw a custom error
            System.err.println("Error fetching beneficiary by ID: " + e.getMessage());
            throw new RuntimeException("Failed to fetch beneficiary.");
        }
    }
    //get all benificary
    public List<Beneficiary> getAllBeneficiary() {
        try {
            return beneficiaryRepository.findAll();
        } catch (Exception e) {
            // Log the exception and throw a custom error
            System.err.println("Error fetching all beneficiaries: " + e.getMessage());
            throw new RuntimeException("Failed to fetch beneficiaries.");
        }
    }
    
    
        

    

    // Delete Beneficiary by ID
    public void deleteBeneficiary(Long id) {
        try {
            beneficiaryRepository.deleteById(id);
        } catch (Exception e) {
            // Log the exception and throw a custom error
            System.err.println("Error deleting beneficiary: " + e.getMessage());
            throw new RuntimeException("Failed to delete beneficiary.");
        }
    }

    // Get all Beneficiaries
    public Iterable<Beneficiary> getAllBeneficiaries() {
        try {
            return beneficiaryRepository.findAll();
        } catch (Exception e) {
            // Log the exception and throw a custom error
            System.err.println("Error fetching all beneficiaries: " + e.getMessage());
            throw new RuntimeException("Failed to fetch beneficiaries.");
        }
    }
}
