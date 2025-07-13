package com.example.demo.Service; // Lowercase 'service'


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.BuddyActivityRepository;
import com.example.demo.model.DeathProject.BuddyActivity;
import com.example.demo.model.DeathProject.BuddyStatus;
import com.example.demo.model.DeathProject.DeathUser;

import jakarta.transaction.Transactional;

import java.util.Random;
import java.util.UUID;

@Service
public class LifeBuddyService {

    @Autowired
    @Qualifier("lifeBuddyMailSender") // Uses MailConfig.java's bean
    private JavaMailSender lifeBuddyMailSender;

    @Autowired
    private BuddyActivityRepository activityRepository;

    private static final String[] MESSAGES = {
        "Hello %s! Did you have chai or filter coffee today? Share your funniest moment from this week!"
,
        "Yo %s, still alive? What’s the silliest thing you’ve seen this week?",
        "Hi %s! What’s the most *jugaadu* thing you did this week? Spill the beans!"

    };

    public void sendBuddyMessage(DeathUser user , String BuddyStatus) {
        try {
            Random random = new Random();
            String name = user.getFirstName() + " " +  user.getLastname();
            //genrate a reandom token 
            
            // Adjust attemptCount to 0-based index for MESSAGES array
            int messageIndex = random.nextInt(MESSAGES.length);
            if (messageIndex < 0) messageIndex = 0; // Handle attemptCount = 0 edge case
            String messageText = String.format(MESSAGES[messageIndex], name);
            String replyLink = "http://localhost:5173/lifebuddy";
            messageText += "\nClick here to chat back: " + replyLink;

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("lifebuddy.gonegift@gmail.com");
            message.setTo(user.getEmail());
            message.setSubject("Buddy's Checking In!");
            message.setText(messageText);
            lifeBuddyMailSender.send(message);

            // Log with current attemptCount (not +1, since it’s already set in scheduler)
            logActivity(user.getUserIdX(), "Buddy Status Changed:)" , BuddyStatus);
        } catch (Exception e) {
            logActivity(user.getUserIdX(), "Failed to send message"+e.getMessage() , BuddyStatus);
            throw new RuntimeException("Failed to send LifeBuddy message", e);
        }
    }
   
    public void lastCall(DeathUser user , String BuddyStatus) {
           String replyLink = "http://localhost:5173/lifebuddy";
           String messageText = "This is my final effort to reach you dear......." +"\nClick here to chat back: " + replyLink;

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("lifebuddy.gonegift@gmail.com");
            message.setTo(user.getEmail());
            message.setSubject("Buddy's Checking In!");
            message.setText(messageText);
            lifeBuddyMailSender.send(message);

            logActivity(user.getUserIdX(), "Buddy Status Changed:)" , BuddyStatus);
    }

    
    @Transactional
    public void sendGoodbyeNotification(DeathUser user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("lifebuddy.gonegift@gmail.com");
            message.setTo(user.getEmail());
            message.setSubject("LifeBuddy’s Final Call Failed");
            message.setText("LifeBuddy thinks " + user.getFirstName() +" "+user.getMiddleName()+" "+user.getLastname()+ " might be gone. No response after all attempts.");
            lifeBuddyMailSender.send(message);

            logActivity(user.getUserIdX(), "Marked as deceased" , BuddyStatus.GOODBYE.toString());
        } catch (Exception e) {
            logActivity(user.getUserIdX(), "Failed to send goodbye notification"+e.getMessage() , BuddyStatus.GOODBYE.toString());
            throw new RuntimeException("Failed to send goodbye notification", e);
        }
    }

    public void logActivity(UUID userIdX, String action , String buddyStatus) {
        BuddyActivity activity = new BuddyActivity();
        activity.setUserIdX(userIdX);
        activity.setBuddyStatus(buddyStatus); 
        activity.setAction(action);
        activityRepository.save(activity);
    }
    
    @Transactional
     public void deleteActivitiesByUserIdX(UUID userIdX) {
        if (activityRepository.existsByUserIdX(userIdX)) {
            activityRepository.deleteAllByUserIdX(userIdX);
        }
    }
}