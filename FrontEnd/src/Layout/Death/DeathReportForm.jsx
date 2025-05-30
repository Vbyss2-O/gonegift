//here also for verification there should be need to upload the death certificate i will add this
// additional feather as soon as possible 

import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const DeathReportForm = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [secretId, setSecretId] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Error fetching user:", error?.message);
        navigate("/login");
        return;
      }
      setCurrentUser(user);
    };
    fetchUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setMessage("You must be logged in to report a death.");
      return;
    }
    if (!secretId || !name || !surname) {
      setMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Step 1: Query death_user by secretId to get user_idx
      const { data: deathUsers, error: userError } = await supabase
        .from("death_user")
        .select("user_idx")
        .eq("secret_key", secretId);

      if (userError) {
        throw new Error(userError.message || "Error fetching user data");
      }

      if (!deathUsers || deathUsers.length === 0) {
        throw new Error("No user found with the provided secret ID");
      }

      if (deathUsers.length > 1) {
        throw new Error("Multiple users found with the same secret ID. Contact support.");
      }

      const deathUserIdX = deathUsers[0].user_idx; // Ensure this matches your column name

      // Step 2: Query beneficiaries for this death_user by the user_idx
      const { data: beneficiaries, error: beneficiaryError } = await supabase
        .from("beneficiary")
        .select("id")
        .eq("id_of_user", deathUserIdX);

      if (beneficiaryError) {
        throw new Error(beneficiaryError.message || "Error fetching beneficiaries");
      }

      if (!beneficiaries || beneficiaries.length === 0) {
        throw new Error("No beneficiaries found for this user. A beneficiary is required.");
      }

      // Step 3: Use the first beneficiary's ID
      const beneficiaryId = beneficiaries[0].id;

      // Step 4: Prepare report data without userIdX
      const reportData = {
        secretId,
        name,
        surname,
        reportDetails: reportDetails || null,
        status: "pending",
        beneficiaryId,
      };

      // Step 5: Submit to backend
      await axios.post("http://localhost:8080/api/death-reports", reportData, {
        headers: { "Content-Type": "application/json" },
      });

      setMessage("Death report submitted successfully!");
      setSecretId("");
      setName("");
      setSurname("");
      setReportDetails("");
    } catch (error) {
      console.error("Report error:", error);
      setMessage(error.message || "Failed to submit death report.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <h2>Report a Death</h2>
      <br />
      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label>Secret ID</label>
          <input
            type="text"
            value={secretId}
            onChange={(e) => setSecretId(e.target.value)}
            placeholder="Enter the secret ID"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter the user’s name"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label>Surname</label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="Enter the user’s surname"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label>Details</label>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Provide any additional details"
            style={styles.textarea}
          />
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
      {message && (
        <p style={message.includes("success") ? styles.success : styles.error}>
          {message}
        </p>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "2.5rem",
    maxWidth: "600px",
    margin: "2rem auto",
    background: "var(--bg-glass)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-rainbow)",
    backdropFilter: "var(--blur-light)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
    transition: "var(--transition-spring)",
  },

  inputGroup: {
    marginBottom: "1.5rem",
    position: "relative",
  },

  input: {
    width: "100%",
    padding: "1rem 1.25rem",
    fontSize: "1rem",
    background: "var(--bg-glass)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "var(--radius-lg)",
    color: "var(--text-primary)",
    transition: "var(--transition)",
    backdropFilter: "var(--blur-light)",
    boxShadow: "var(--shadow-sm)",
    "&:focus": {
      outline: "none",
      borderColor: "var(--primary)",
      boxShadow: "var(--shadow-glow)",
      transform: "translateY(-2px)",
    },
    "&:hover": {
      borderColor: "var(--primary-light)",
      boxShadow: "var(--shadow-md)",
    },
  },

  textarea: {
    width: "100%",
    padding: "1rem 1.25rem",
    fontSize: "1rem",
    minHeight: "120px",
    background: "var(--bg-glass)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "var(--radius-lg)",
    color: "var(--text-primary)",
    transition: "var(--transition)",
    backdropFilter: "var(--blur-light)",
    boxShadow: "var(--shadow-sm)",
    resize: "vertical",
    "&:focus": {
      outline: "none",
      borderColor: "var(--primary)",
      boxShadow: "var(--shadow-glow)",
      transform: "translateY(-2px)",
    },
    "&:hover": {
      borderColor: "var(--primary-light)",
      boxShadow: "var(--shadow-md)",
    },
  },

  button: {
    padding: "1rem 2rem",
    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
    color: "var(--text-light)",
    border: "none",
    borderRadius: "var(--radius-lg)",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "var(--transition-spring)",
    position: "relative",
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "var(--shadow-xl)",
    },
    "&:active": {
      transform: "translateY(-1px)",
    },
    "&:disabled": {
      background: "linear-gradient(135deg, var(--text-gray), #999)",
      cursor: "not-allowed",
      opacity: "0.7",
    },
  },

  success: {
    color: "var(--accent3)",
    marginTop: "1rem",
    padding: "1rem",
    borderRadius: "var(--radius-lg)",
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))",
    fontWeight: "600",
    border: "1px solid rgba(16, 185, 129, 0.2)",
  },

  error: {
    color: "var(--accent4)",
    marginTop: "1rem",
    padding: "1rem",
    borderRadius: "var(--radius-lg)",
    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
    fontWeight: "600",
    border: "1px solid rgba(239, 68, 68, 0.2)",
  },

  // Add media queries for responsiveness
  "@media (max-width: 768px)": {
    container: {
      margin: "1.5rem",
      padding: "2rem",
    },
    button: {
      width: "100%",
    },
  },

  "@media (max-width: 480px)": {
    container: {
      margin: "1rem",
      padding: "1.5rem",
    },
    input: {
      padding: "0.875rem 1rem",
    },
    textarea: {
      padding: "0.875rem 1rem",
    },
  },
};



export default DeathReportForm;
