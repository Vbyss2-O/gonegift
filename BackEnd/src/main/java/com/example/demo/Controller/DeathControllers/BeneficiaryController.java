package com.example.demo.Controller.DeathControllers;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.demo.Service.BeneficiaryService;
import com.example.demo.model.DeathProject.Beneficiary;

import java.util.Optional;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {
    @Autowired
    private BeneficiaryService beneficiaryService;

    // Create or update a Beneficiary
    @PostMapping
    public Beneficiary createOrUpdateBeneficiary(@RequestBody Beneficiary beneficiary) {
        return beneficiaryService.saveOrUpdate(beneficiary);
    }

    // Fetch a Beneficiary by ID
    @GetMapping("/{id}")
    public Optional<Beneficiary> getBeneficiaryById(@PathVariable Long id) {
        return beneficiaryService.getBeneficiaryById(id);
    }

    // Delete a Beneficiary by ID
    @DeleteMapping("/{id}")
    public void deleteBeneficiaryById(@PathVariable Long id) {
        beneficiaryService.deleteBeneficiary(id);
    }

    // List all Beneficiaries
    @GetMapping
    public Iterable<Beneficiary> getAllBeneficiaries() {
        return beneficiaryService.getAllBeneficiaries();
    }
}
