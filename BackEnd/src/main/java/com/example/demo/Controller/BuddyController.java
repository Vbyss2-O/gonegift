package com.example.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Repo.BuddyActivityRepository;
import com.example.demo.Repo.DeathUserRepository;
import com.example.demo.model.DeathProject.BuddyActivity;
import com.example.demo.model.DeathProject.BuddyStatus;
import com.example.demo.model.DeathProject.DeathUser;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
public class BuddyController {

    @Autowired
    private DeathUserRepository userRepository;

    @Autowired
    private BuddyActivityRepository activityRepository;

    @GetMapping("/buddy")
    public ResponseEntity<String> handleBuddyResponse(@RequestParam("userId") String userId, @RequestParam String token) {
        Optional<DeathUser> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid user ID.");
        }

        DeathUser user = userOpt.get();
        

        user.setLastInteraction(LocalDateTime.now());
        user.setAttemptCount(0); 
        user.setBuddyStatus(BuddyStatus.CHILLING); 
        userRepository.save(user);

        // Log the response in BuddyActivity
        BuddyActivity activity = new BuddyActivity();
        activity.setUserIdX(userId);
        activity.setTimestamp(LocalDateTime.now());
        activity.setAction("User Responded");
        activityRepository.save(activity);

        return ResponseEntity.ok("LifeBuddy says: Yay, you’re alive! Thanks for checking in!");
    }

    @GetMapping("/lifebuddy/activities/{userId}")
    public ResponseEntity<List<BuddyActivity>> getUserActivities(@PathVariable String userId) {
        List<BuddyActivity> activities = activityRepository.findByUserIdXOrderByTimestampAsc(userId);
        if (activities.isEmpty()) {
            return ResponseEntity.noContent().build(); // 204 No Content, no body
        }
        return ResponseEntity.ok(activities);
    }
}