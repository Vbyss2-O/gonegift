package com.example.demo.Service; // Lowercase 'service'


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.BuddyActivityRepository;
import com.example.demo.model.DeathProject.BuddyActivity;
import com.example.demo.model.DeathProject.DeathUser;

import java.util.Random;

@Service
public class LifeBuddyService {

    @Autowired
    @Qualifier("lifeBuddyMailSender") // Uses MailConfig.java's bean
    private JavaMailSender lifeBuddyMailSender;

    @Autowired
    private BuddyActivityRepository activityRepository;

    private static final String[] MESSAGES = {
        "Hey %s! Did you wrestle a bear today? Tell me your wildest moment!",
        "Yo %s, still alive? What’s the silliest thing you’ve seen this week?",
        "Uh-oh %s, did the zombies get you? Reply or I’ll send my cartoon minions!"
    };

    public void sendBuddyMessage(DeathUser user) {
        try {
            Random random = new Random();
            String name = user.getFirstName() + " " +  user.getLastname();
            //genrate a reandom token 
            
            // Adjust attemptCount to 0-based index for MESSAGES array
            int messageIndex = random.nextInt(MESSAGES.length);
            if (messageIndex < 0) messageIndex = 0; // Handle attemptCount = 0 edge case
            String messageText = String.format(MESSAGES[messageIndex], name);
            String replyLink = "http://localhost:8080/lifebuddy?userId=" + user.getUserIdX();
            messageText += "\nClick here to chat back: " + replyLink;

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("devlomentpurpose@gmail.com");
            message.setTo(user.getEmail());
            message.setSubject("Buddy's Checking In!");
            message.setText(messageText);
            lifeBuddyMailSender.send(message);

            // Log with current attemptCount (not +1, since it’s already set in scheduler)
            logActivity(user.getUserIdX(), "Sent message");
        } catch (Exception e) {
            logActivity(user.getUserIdX(), "Failed to send message"+e.getMessage());
            throw new RuntimeException("Failed to send LifeBuddy message", e);
        }
    }
    public void lastCall(DeathUser user){
           String replyLink = "http://localhost:8080/lifebuddy?userId=" + user.getUserIdX();
           String messageText = "This is my final effort to reach you dear......." +"\nClick here to chat back: " + replyLink;

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("devlomentpurpose@gmail.com");
            message.setTo(user.getEmail());
            message.setSubject("Buddy's Checking In!");
            message.setText(messageText);
            lifeBuddyMailSender.send(message);

            logActivity(user.getUserIdX(), "Sent message");
    }

    public void sendGoodbyeNotification(DeathUser user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("devlomentpurpose@gmail.com");
            message.setTo(user.getEmail());
            message.setSubject("LifeBuddy’s Final Call");
            message.setText("LifeBuddy thinks " + user.getUserIdX() + " might be gone. No response after all attempts.");
            lifeBuddyMailSender.send(message);

            logActivity(user.getUserIdX(), "Marked as deceased");
        } catch (Exception e) {
            logActivity(user.getUserIdX(), "Failed to send goodbye notification"+e.getMessage());
            throw new RuntimeException("Failed to send goodbye notification", e);
        }
    }

    private void logActivity(String userIdX, String action) {
        BuddyActivity activity = new BuddyActivity();
        activity.setUserIdX(userIdX);
        activity.setAction(action);
        activityRepository.save(activity);
    }
}