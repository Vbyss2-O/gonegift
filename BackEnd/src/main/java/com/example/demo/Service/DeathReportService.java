package com.example.demo.Service;

import com.example.demo.Repo.DeathReportRepository;
import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.model.DeathProject.Beneficiary;
import com.example.demo.model.DeathProject.DeathReport;
import com.example.demo.model.DeathProject.DeathUser;
import com.example.demo.model.DeathProject.Token;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class DeathReportService {

    @Autowired
    private DeathReportRepository deathReportRepository;

    @Autowired
    private DeathUserRepository deathUserRepository;

    @Autowired
    @Qualifier("developmentMailSender")
    private JavaMailSender mailSender;

    @Autowired
    private TokenService tokenService;

    public List<DeathReport> findAllReports() {
        return deathReportRepository.findAll();
    }

    @Transactional
    public void saveDeathReport(DeathReport report) {
        deathReportRepository.save(report);
    }

    @Transactional
    public void triggerReport(Long reportId) {
        DeathReport report = deathReportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Report not found with ID: " + reportId));

        report.setStatus("approved");
        deathReportRepository.save(report);

        DeathUser user = deathUserRepository.findBySecretKey(report.getSecretId());
        if (user == null) {
            throw new RuntimeException("User not found with secret ID: " + report.getSecretId());
        }
        user.setIsdeceased(true);
        deathUserRepository.save(user);

        sendMagicLinks(user);
    }

    @Transactional
    public void triggerUser(DeathUser user) {
        if (user == null) {
            throw new RuntimeException("Null user found");
        }
        user.setIsdeceased(true);
        deathUserRepository.save(user);

        sendMagicLinks(user);
    }

    private void sendMagicLinks(DeathUser user) {
        List<Beneficiary> beneficiaries = user.getBeneficiaries();
        if (beneficiaries == null || beneficiaries.isEmpty()) {
            throw new RuntimeException("No beneficiaries found for user: " + user.getUserIdX());
        }

        for (Beneficiary beneficiary : beneficiaries) {
            try {
                String token = generateMagicToken(user.getUserIdX());
                
                String magicLink = "http://localhost:5173/ClaimAssets/verify?token=" + token;

                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("devlomentpurpose@gmail.com"); 
                message.setTo(beneficiary.getEmail());
                message.setSubject("Access to Deceased User Data - Magic Link");
                message.setText(
                    "Dear Beneficiary,\n\n" +
                    "The user with ID " + user.getUserIdX() + " has been confirmed deceased.\n" +
                    "To access their data, please click the link below and enter your decryption key:\n\n" +
                    magicLink + "\n\n" +
                    "Regards,\nGoneGift Team"
                );
                // mailSender.send(message);
            try {
                mailSender.send(message);
            } catch (MailAuthenticationException e) {
                System.err.println("Authentication failed: " + e.getMessage());
                throw new RuntimeException("Email authentication failed. Please check SMTP credentials.", e);
            } catch (MailSendException e) {
                System.err.println("Failed to send email: " + e.getMessage());
                throw new RuntimeException("Email sending failed. Please check SMTP configuration.", e);
            }
            } catch (Exception e) {
                System.err.println("Failed to send email to " + beneficiary.getEmail() + ": " + e.getMessage());
            }
        }
    }

    public String generateMagicToken(String userId) {
        String rawToken = UUID.randomUUID().toString(); // Generate random token
        String hashedToken = BCrypt.hashpw(rawToken, BCrypt.gensalt(10)); // Hash token
        String encodedToken = Base64.getEncoder().encodeToString(rawToken.getBytes()); // Encode token for URL
    
        // Store the hashed version in the database (not the raw token)
        Token magicToken = new Token();
        magicToken.setUserIDX(userId);
        magicToken.setHashtoken(hashedToken);
        
        magicToken.setExpirydate(LocalDate.now().plusDays(7)); 
        tokenService.storeToken(magicToken);
    
        return encodedToken; // Send encoded raw token to the user
    }
}