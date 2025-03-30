package com.example.demo.Service;




import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.model.DeathProject.BuddyStatus;
import com.example.demo.model.DeathProject.DeathUser;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BuddyScheduler {

  
    
        @Autowired
        private DeathUserRepository userRepository;
    
        @Autowired
        private LifeBuddyService buddyService;

        @Autowired
        private DeathReportService deathReportService;

       
    
        @Scheduled(fixedRate = 12 * 60 * 60 * 1000) // runs 12 hour 
        public void checkUsers() {
            LocalDateTime now = LocalDateTime.now();
            List<DeathUser> users = userRepository.findAll();
    
            for (DeathUser user : users) {
                long daysSinceLastActivity = user.getLastActivityDate() != null
                    ? ChronoUnit.DAYS.between(user.getLastActivityDate(), now)
                    : 0;
    
                // Check lastInteraction first (for all states except CHILLING)
                if (user.getBuddyStatus() != BuddyStatus.CHILLING && 
                user.getLastInteraction() != null && 
                user.getLastInteraction().isAfter(user.getLastActivityDate())) {
                // User responded, reset to CHILLING
                
                user.setLastActivityDate(user.getLastInteraction());
                user.setInactivityThresholdDays(0); // inactivity counter
                user.setLastInteraction(null);
                user.setBuddyStatus(BuddyStatus.CHILLING);
                user.setAttemptCount(0);
                
            } else {
                // No response, proceed with state transitions
                switch (user.getBuddyStatus()) {
                    case CHILLING:
                        if (daysSinceLastActivity >= 20) {
                            user.setBuddyStatus(BuddyStatus.CHILLING1);
                            user.setAttemptCount(1);
                            buddyService.sendBuddyMessage(user);
                            user.setInactivityThresholdDays((int)daysSinceLastActivity);
                            user.setLastInteraction(now);
                                
                        }
                        break;
                    case CHILLING1:
                        if (daysSinceLastActivity >= 21 && user.getAttemptCount() == 1 && user.getInactivityThresholdDays() >=21) { // 20 + 1 day
                            user.setBuddyStatus(BuddyStatus.CURIOUS);
                            user.setAttemptCount(2);
                            buddyService.sendBuddyMessage(user);
                            user.setInactivityThresholdDays((int)daysSinceLastActivity);
                            user.setLastInteraction(now);
                        }
                        break;
                    case CURIOUS:
                        if (daysSinceLastActivity >= 22 && user.getAttemptCount() == 2 && user.getInactivityThresholdDays() >=22) { // 20 + 1 + 1 day
                            user.setBuddyStatus(BuddyStatus.WORRIED);
                            user.setAttemptCount(3);
                            buddyService.sendBuddyMessage(user);
                            user.setInactivityThresholdDays((int)daysSinceLastActivity);
                            user.setLastInteraction(now);
                        }
                        break;
                    case WORRIED:
                        if (daysSinceLastActivity >= 23 && user.getAttemptCount() == 3 && user.getInactivityThresholdDays() >=23) { // 20 + 1 + 1 + 1 day
                            user.setBuddyStatus(BuddyStatus.GOODBYE);
                            buddyService.sendGoodbyeNotification(user);
                            user.setInactivityThresholdDays((int)daysSinceLastActivity);
                            user.setLastInteraction(now);
                            
                        }
                        break;
                    case GOODBYE:
                       if(!user.isIsdeceased()){
                        deathReportService.triggerUser(user);
                        user.setIsdeceased(true);
                       }
                       break;
                    default:
                        
                        break;
                }
            }
            userRepository.save(user);
        }
    }
}