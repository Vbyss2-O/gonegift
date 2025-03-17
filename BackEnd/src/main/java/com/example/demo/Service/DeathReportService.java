// package com.example.demo.Service;


// import com.example.demo.Repo.BeneficiaryRepository;
// import com.example.demo.Repo.DeathReportRepository;
// import com.example.demo.Repo.DeathUserRepository;
// import com.example.demo.model.DeathProject.Beneficiary;
// import com.example.demo.model.DeathProject.DeathReport;
// import com.example.demo.model.DeathProject.DeathUser;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.mail.SimpleMailMessage;
// import org.springframework.mail.javamail.JavaMailSender;
// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

// import java.util.List;

// @Service
// public class DeathReportService {

//     @Autowired
//     private DeathReportRepository deathReportRepository;

//     @Autowired
//     private DeathUserRepository deathUserRepository;

//     @Autowired
//     private BeneficiaryRepository beneficiaryRepository;

//     @Autowired
//     private JavaMailSender mailSender; // Inject JavaMailSender

//     public List<DeathReport> findAllReports() {
//         return deathReportRepository.findAll();
//     }

//     @Transactional
//     // public void saveDeathReport(DeathReport report) {
//     //     Beneficiary beneficiary = beneficiaryRepository.findById(report.getBeneficiary().getId())
//     //         .orElseThrow(() -> new RuntimeException("Beneficiary not found with ID: " + report.getBeneficiary().getId()));
//     //     report.setBeneficiary(beneficiary);
//     //     deathReportRepository.save(report);
//     // }
//     public void saveDeathReport(DeathReport report) {
//         deathReportRepository.save(report);
//     }

//     public void triggerReport(Long reportId) {
//         DeathReport report = deathReportRepository.findById(reportId)
//             .orElseThrow(() -> new RuntimeException("Report not found with ID: " + reportId));
//         report.setStatus("approved");
//         deathReportRepository.save(report);

//         DeathUser user = deathUserRepository.findBySecretKey(report.getSecretId());
         
//         if (user == null) {
//             throw new RuntimeException("User not found with secret ID: " + report.getSecretId());
//         }
//         user.setIsdeceased(true);
//         deathUserRepository.save(user);

//         // Fetch all beneficiaries for the user using the new query
//         List<Beneficiary> beneficiaries = beneficiaryRepository.findByUserIdX(user.getUserIdX());

//         // Fetch all files for the user
//         List<String> fileUrls = deathUserRepository.findById(user.getUserIdX())
//             .map(u -> u.getFiles().stream()
//                 .map(f -> f.getLetterFileUrl() != null ? f.getLetterFileUrl() : f.getMediaFileUrl())
//                 .filter(url -> url != null)
//                 .toList())
//             .orElse(List.of());

//         String fileList = fileUrls.isEmpty() ? "No files available" : String.join("\n", fileUrls);

//         // Send email to all beneficiaries
//         for (Beneficiary beneficiary : beneficiaries) {
//             SimpleMailMessage message = new SimpleMailMessage();
//             message.setFrom("your-email@gmail.com"); 
//             message.setTo(beneficiary.getEmail());
//             message.setSubject("Data Transfer for User " + user.getUserIdX());
//             message.setText(
//                 "Dear Beneficiary,\n\n" +
//                 "The user with ID " + user.getUserIdX() + " has been confirmed deceased. Here is their data:\n\n" +
//                 fileList + "\n\n" +
//                 "Regards,\nGoneGift Team"
//             );
//             mailSender.send(message);
//         }
//     }
// }


// -------
package com.example.demo.Service;

import com.example.demo.Repo.DeathReportRepository;
import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.model.DeathProject.Beneficiary;
import com.example.demo.model.DeathProject.DeathReport;
import com.example.demo.model.DeathProject.DeathUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeathReportService {

    @Autowired
    private DeathReportRepository deathReportRepository;

    @Autowired
    private DeathUserRepository deathUserRepository;

   

    @Autowired
    private JavaMailSender mailSender;

    public List<DeathReport> findAllReports() {
        return deathReportRepository.findAll();
    }

    @Transactional
    public void saveDeathReport(DeathReport report) {
        // Validate the beneficiary exists
        //just save
        deathReportRepository.save(report);
    }

    //admin side trigger
    @Transactional
    public void triggerReport(Long reportId) {
        // Fetch the report
        DeathReport report = deathReportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Report not found with ID: " + reportId));

        // Update report status
        report.setStatus("approved");
        deathReportRepository.save(report);

        // Fetch and update the DeathUser
        DeathUser user = deathUserRepository.findBySecretKey(report.getSecretId());
        if (user == null) {
            throw new RuntimeException("User not found with secret ID: " + report.getSecretId());
        }
        user.setIsdeceased(true);
        deathUserRepository.save(user);

        // Fetch beneficiaries (handle null case)
        List<Beneficiary> beneficiaries = user.getBeneficiaries();
        if (beneficiaries == null || beneficiaries.isEmpty()) {
            throw new RuntimeException("No beneficiaries found for user: " + user.getUserIdX());
        }

        // Fetch files (handle null case)
        List<String> fileUrls = (user.getFiles() != null)
            ? user.getFiles().stream()
                .map(f -> (f.getLetterFileUrl() != null) ? f.getLetterFileUrl() : f.getMediaFileUrl())
                .filter(url -> url != null) // Ensure no null values
                .collect(Collectors.toList())
            : List.of();

        String fileList = fileUrls.isEmpty() ? "No files available" : String.join("\n", fileUrls);

        // Send email to all beneficiaries
        for (Beneficiary beneficiary : beneficiaries) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("devlomentpurpose@gmai.com"); // Replace with your actual sender email
                message.setTo(beneficiary.getEmail());
                message.setSubject("Data Transfer for User " + user.getUserIdX());
                message.setText(
                    "Dear Beneficiary,\n\n" +
                    "The user with ID " + user.getUserIdX() + " has been confirmed deceased. Here is their data:\n\n" +
                    fileList + "\n\n" +
                    "Regards,\nGoneGift Team"
                );
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Failed to send email to " + beneficiary.getEmail() + ": " + e.getMessage());
            }
        }
    }
    @Transactional
    public void triggerUser(DeathUser user){
        if (user == null) {
            throw new RuntimeException("null user founded");
        }
        user.setIsdeceased(true);
        deathUserRepository.save(user);

        // Fetch beneficiaries (handle null case)
        List<Beneficiary> beneficiaries = user.getBeneficiaries();
        if (beneficiaries == null || beneficiaries.isEmpty()) {
            throw new RuntimeException("No beneficiaries found for user: " + user.getUserIdX());
        }

        // Fetch files (handle null case)
        List<String> fileUrls = (user.getFiles() != null)
            ? user.getFiles().stream()
                .map(f -> (f.getLetterFileUrl() != null) ? f.getLetterFileUrl() : f.getMediaFileUrl())
                .filter(url -> url != null) // Ensure no null values
                .collect(Collectors.toList())
            : List.of();

        String fileList = fileUrls.isEmpty() ? "No files available" : String.join("\n", fileUrls);

        // Send email to all beneficiaries
        for (Beneficiary beneficiary : beneficiaries) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("devlomentpurpose@gmai.com"); // Replace with your actual sender email
                message.setTo(beneficiary.getEmail());
                message.setSubject("Data Transfer for User " + user.getUserIdX());
                message.setText(
                    "Dear Beneficiary,\n\n" +
                    "The user with ID " + user.getUserIdX() + " has been confirmed deceased. Here is their data:\n\n" +
                    fileList + "\n\n" +
                    "Regards,\nGoneGift Team"
                );
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Failed to send email to " + beneficiary.getEmail() + ": " + e.getMessage());
            }
        }
    }
}