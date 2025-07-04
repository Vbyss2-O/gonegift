package com.example.demo.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Service.ProblemService;
import com.example.demo.model.DeathProject.Problem;

@RestController
@RequestMapping("/problem")
public class ProblemController {
    @Autowired
    private ProblemService problemService;
    @PostMapping("/add")
    public ResponseEntity<Void> addProblem(@RequestBody Problem problem) {
        problemService.addProblem(problem);
        return ResponseEntity.ok().build();
    }
    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteProblem(@RequestBody Problem problem) {
        problemService.deleteProblem(problem);
        return ResponseEntity.ok().build();
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteProblemById(@RequestBody Long id) {
        problemService.deleteByID(id);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/get/{id}")
    public Problem getProblemById(@PathVariable Long id) {
        return problemService.getProblemById(id);
    }
    @GetMapping("/getAll")
    public List<Problem> getAllProblems() {
        return problemService.getAllProblems();
    }

    
}
