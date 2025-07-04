import React, { useState } from "react";
import "./ProblemSubmit.css";
import axios from "axios";

const HelpCenterForm = () => {
  const [email, setEmail] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const problemData = {
      email:email,
      problemDescription:problemDescription,
      createdDate: new Date().toISOString(),
    };

    try {
      const response = await fetch("http://localhost:8080/problem/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(problemData),
      });
    //   call thorugh axios
    //     const response = await axios.post("http://localhost:8080/problem/add", problemData, {
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    // });

      if (response.ok) {
        setSubmitSuccess(true);
        setSubmitError("");
        setEmail("");
        setProblemDescription("");
      } else {
        throw new Error("Failed to submit your problem.");
      }
    } catch (error) {
      console.error(error);
      setSubmitError("There was an error submitting your request. Please try again.");
      setSubmitSuccess(false);
    }
  };

  return (
    <div className="problemform-container">
      <h2 className="problemform-title">Help Center</h2>
      <form className="problemform-form" onSubmit={handleSubmit}>
        <div className="problemform-group">
          <label htmlFor="email" className="problemform-label">Your Email:</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="problemform-input"
          />
        </div>

        <div className="problemform-group">
          <label htmlFor="problem" className="problemform-label">Describe your problem:</label>
          <textarea
            id="problem"
            required
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            rows="4"
            className="problemform-textarea"
          />
        </div>

        <button type="submit" className="problemform-submit-btn">
          Submit
        </button>
      </form>

      {submitSuccess && (
        <p className="problemform-success">
          Thank you! Your problem has been submitted.
        </p>
      )}
      {submitError && (
        <p className="problemform-error">
          {submitError}
        </p>
      )}
    </div>
  );
};

export default HelpCenterForm;