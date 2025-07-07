package com.example.demo.Service;

import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.model.DeathProject.BuddyStatus;
import com.example.demo.model.DeathProject.DeathUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

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

    /**
     * this scheduled task runs every day at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void checkUsers() {
        LocalDateTime now = LocalDateTime.now();
        List<DeathUser> users = userRepository.findAll();

        for (DeathUser user : users) {
            boolean stateChanged = false;
            if(!user.getFlag()){
                // Skip users who are not flagged for buddy status updates
                //this is states that dead man toggle switch is off
                continue;   
            }

            long daysSinceLastActivity = user.getLastActivityDate() != null
                    ? ChronoUnit.DAYS.between(user.getLastActivityDate(), now)
                    : 0;

            if (
                user.getBuddyStatus() != BuddyStatus.CHILLING &&
                user.getLastInteraction() != null &&
                user.getLastActivityDate() != null &&
                user.getLastInteraction().isAfter(user.getLastActivityDate())
            ) {
                user.setLastActivityDate(user.getLastInteraction());
                user.setLastInteraction(null);
                user.setInactivityThresholdDays(0);
                user.setAttemptCount(0);
                user.setBuddyStatus(BuddyStatus.CHILLING);
                stateChanged = true;

            } else {
                switch (user.getBuddyStatus()) {
                    case CHILLING:
                        if (daysSinceLastActivity >= 90 && user.getAttemptCount() == 0) {
                            user.setBuddyStatus(BuddyStatus.CHILLING1);
                            user.setAttemptCount(1);
                            user.setInactivityThresholdDays((int) daysSinceLastActivity);
                            user.setLastInteraction(now);
                            stateChanged = true;
                        }
                        break;

                    case CHILLING1:
                        if (daysSinceLastActivity >= 95 && user.getAttemptCount() == 1) {
                            user.setBuddyStatus(BuddyStatus.CURIOUS);
                            user.setAttemptCount(2);
                            buddyService.sendBuddyMessage(user, "CHILLING1");
                            user.setInactivityThresholdDays((int) daysSinceLastActivity);
                            user.setLastInteraction(now);
                            stateChanged = true;
                        }
                        break;

                    case CURIOUS:
                        if (daysSinceLastActivity >= 110 && user.getAttemptCount() == 2) {
                            user.setBuddyStatus(BuddyStatus.WORRIED);
                            user.setAttemptCount(3);
                            buddyService.sendBuddyMessage(user, "CURIOUS");
                            user.setInactivityThresholdDays((int) daysSinceLastActivity);
                            user.setLastInteraction(now);
                            stateChanged = true;
                        }
                        break;

                    case WORRIED:
                        if (daysSinceLastActivity >= 120 && user.getAttemptCount() == 3) {
                            user.setBuddyStatus(BuddyStatus.GOODBYE);
                            buddyService.lastCall(user, "WORRIED");
                            user.setAttemptCount(4);
                            user.setInactivityThresholdDays((int) daysSinceLastActivity);
                            user.setLastInteraction(now);
                            stateChanged = true;
                        }
                        break;

                    case GOODBYE:
                        if (
                            daysSinceLastActivity >= 140 &&
                            !user.isIsdeceased() &&
                            user.getAttemptCount() == 4 &&
                            user.getInactivityThresholdDays() >= 120
                        ) {
                            buddyService.sendGoodbyeNotification(user);
                            deathReportService.triggerUser(user);
                            user.setAttemptCount(5); 
                        }
                        break;

                    default:
                        break;
                }
            }

            if (stateChanged) {
                userRepository.save(user);
            }
        }
    }
}
