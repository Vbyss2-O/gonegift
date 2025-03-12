package com.example.demo.Controller.DeathControllers;


import com.example.demo.Service.DeathReportService;
// import com.example.demo.Service.DeathUserService;
import com.example.demo.model.DeathProject.DeathReport;
// import com.example.demo.model.DeathProject.DeathUser;

// import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
// import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private DeathReportService deathReportService;

    
    // @Autowired
    // private DeathUserService deathUserService;
   

    // Get all death reports (not just pending, for full visibility)
    @GetMapping("/death-reports")
    public ResponseEntity<List<DeathReport>> getAllReports() {
        List<DeathReport> reports = deathReportService.findAllReports();
        return ResponseEntity.ok(reports);
    }

    // Mark a death report as done
    // @PostMapping("/death-reports/mark-done/{reportId}")
    // public ResponseEntity<String> markReportAsDone(@PathVariable Long reportId) {
    //     try {
    //         deathReportService.markReportAsDone(reportId);
    //         return ResponseEntity.ok("Report marked as done successfully");
    //     } catch (Exception e) {
    //         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
    //             .body("Failed to mark report as done: " + e.getMessage());
    //     }
    // }

    // Review and trigger a death report
    @PostMapping("/death-reports/trigger/{reportId}")
    public ResponseEntity<String> triggerReport(@PathVariable Long reportId) {
        try {
            deathReportService.triggerReport(reportId);
            return ResponseEntity.ok("Report triggered successfully, user marked as deceased");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to trigger report: " + e.getMessage());
        }
    }
    //here i am testing the controller 
    // @GetMapping("/testFile")
    // @Transactional  // 🔥 Ensures files are fetched within a session
    // public void doTest() {
    //     Optional<DeathUser> optionalUser = deathUserService.getUserById("3cbbb300-4982-41c2-9832-e6f2ea490f18");
    
    //     if (optionalUser.isEmpty()) {  
    //         System.out.println("User not found");
    //         return;
    //     }
    
    //     DeathUser testing = optionalUser.get();  
    //     System.out.println(testing.getFiles());
    // }
    
    // @GetMapping("/testBenificiary")
    // @Transactional  // 🔥 Ensures beneficiaries are fetched within a session
    // public void doTestBenificiary() {
    //     Optional<DeathUser> optionalUser = deathUserService.getUserById("rZHhBkJBYaVjtaI8Ll1smCGLttU2");
    
    //     if (optionalUser.isEmpty()) {  
    //         System.out.println("User not found");
    //         return;
    //     }
    
    //     DeathUser testing = optionalUser.get();  
    //     System.out.println(testing.getBeneficiaries());
    // }
}
