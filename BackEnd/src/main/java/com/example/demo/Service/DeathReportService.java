package com.example.demo.Service;

import com.example.demo.Repo.DeathReportRepository;
import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.model.DeathProject.Beneficiary;
import com.example.demo.model.DeathProject.DeathReport;
import com.example.demo.model.DeathProject.DeathUser;

import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeathReportService {
    private static final Logger logger = LoggerFactory.getLogger(DeathReportService.class);

    @Autowired
    private DeathReportRepository deathReportRepository;

    @Autowired
    private DeathUserRepository deathUserRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private SupabaseService supabaseService;

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

        processUserAndSendEmails(user);
    }

    @Transactional
    public void triggerUser(DeathUser user) {
        if (user == null) {
            throw new RuntimeException("null user founded");
        }
        processUserAndSendEmails(user);
    }

    private void processUserAndSendEmails(DeathUser user) {
        user.setIsdeceased(true);
        deathUserRepository.save(user);

        List<Beneficiary> beneficiaries = user.getBeneficiaries();
        if (beneficiaries == null || beneficiaries.isEmpty()) {
            throw new RuntimeException("No beneficiaries found for user: " + user.getUserIdX());
        }

        List<String> fileUrls = (user.getFiles() != null)
            ? user.getFiles().stream()
                .map(f -> (f.getLetterFileUrl() != null) ? f.getLetterFileUrl() : f.getMediaFileUrl())
                .filter(url -> url != null)
                .collect(Collectors.toList())
            : List.of();

        for (Beneficiary beneficiary : beneficiaries) {
            try {
                sendSecureEmail(beneficiary, user, fileUrls);
                logger.info("Successfully sent email to beneficiary: {}", beneficiary.getEmail());
            } catch (Exception e) {
                logger.error("Failed to send email to {}: {}", beneficiary.getEmail(), e.getMessage());
            }
        }
    }

    private void sendSecureEmail(Beneficiary beneficiary, DeathUser user, List<String> fileUrls) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("devlomentpurpose@gmail.com");
        helper.setTo(beneficiary.getEmail());
        helper.setSubject("Secure Data Transfer - User " + user.getUserIdX());
        helper.setText(createEmailContent(user.getUserIdX()), true);

        // Process and attach each file
        for (String url : fileUrls) {
            try {
                byte[] decryptedData = supabaseService.downloadAndDecryptFile(url);
                String fileName = extractFileName(url);
                helper.addAttachment(fileName, new ByteArrayResource(decryptedData));
                logger.info("Successfully processed file: {}", fileName);
            } catch (Exception e) {
                logger.error("Failed to process file {}: {}", url, e.getMessage());
            }
        }

        mailSender.send(message);
    }

    private String createEmailContent(String userId) {
            return String.format("""
                <html>
                <body>
                    <h2>Secure Data Transfer Notification</h2>
                    <p>Dear Beneficiary,</p>
                    <p>You have received secure files from user ID: %d.</p>
                    <p>The attached files have been securely decrypted for your access.</p>0
                    <p><strong>Security Notice:</strong> Please save these files in a secure location.</p>
                    <p>Best regards,<br>GoneGift Team</p>
                </body>
                </html>
                """, userId);
    }

    private String extractFileName(String url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }
}