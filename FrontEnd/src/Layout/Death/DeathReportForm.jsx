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
          <label>Details (Optional)</label>
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
  container: { padding: "20px", maxWidth: "600px", margin: "0 auto" },
  inputGroup: { marginBottom: "15px" },
  input: { width: "100%", padding: "8px", fontSize: "16px" },
  textarea: { width: "100%", padding: "8px", fontSize: "16px", height: "100px" },
  button: { padding: "10px 20px", backgroundColor: "#007bff", color: "#fff", border: "none" },
  success: { color: "green", marginTop: "10px" },
  error: { color: "red", marginTop: "10px" },
};

export default DeathReportForm;
