package com.example.demo.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Repo.ProblemRepository;
import com.example.demo.model.DeathProject.Problem;

@Service
public class ProblemService {
    @Autowired
    private ProblemRepository problemRepository;
    public void addProblem(Problem problem) {
        problemRepository.save(problem);
    }
    public void deleteProblem(Problem problem) {
        problemRepository.delete(problem);
    }
    public Problem getProblemById(Long id) {
        return problemRepository.findById(id).orElse(null);
    }
    public List<Problem> getAllProblems() {
        return problemRepository.findAll();
    }
    public void deleteByID(Long id) {
        problemRepository.deleteById(id);
    }
}
