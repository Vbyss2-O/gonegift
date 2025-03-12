package com.example.demo.Controller.DeathControllers;

import com.example.demo.Service.DeathReportService;
import com.example.demo.model.DeathProject.DeathReport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/death-reports")
public class DeathReportController {

    @Autowired
    private DeathReportService deathReportService;

    // Submit a new death report (for general users/beneficiaries)
    @PostMapping
    public ResponseEntity<String> submitDeathReport(@RequestBody DeathReport deathReport) {
        try {
            deathReportService.saveDeathReport(deathReport);
            return new ResponseEntity<>("Death report submitted successfully", HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to submit death report: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
