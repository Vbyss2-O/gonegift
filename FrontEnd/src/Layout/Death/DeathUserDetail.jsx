import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const UserDetailsForm = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [uuid, setUuid] = useState("");

  // Hashing function using crypto.subtle API
  const hashWithSalt = async (uuid) => {
    const salt = uuid.substring(0, 16); // Use first 16 characters of UUID as salt
    const text = uuid + salt; // Append salt to UUID
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          console.error("User not found or error:", error?.message || "No user found");
          navigate("/login");
        }
      } catch (err) {
        console.error("Error in checkUser:", err.message);
        navigate("/login");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error("Error fetching user:", error?.message || "No user found");
        navigate("/login");
        return;
      }

      const userIdX = data.user.id;
      const email = data.user.email;
      const generatedUuid = uuidv4();
      setUuid(generatedUuid);

      const hashedUuid = await hashWithSalt(generatedUuid);

      const userDetails = {
        userIdX : userIdX,
        email: email,
        firstName:firstName,
        lastname:lastName,
        lastActivityDate: new Date().toISOString(),
        inactivityThresholdDays: 0,
        relativeId: null,
        userRole: "general",
        isdeceased: false,
        attemptCount: 0,
        nextBuddyDate: null,
        lastInteraction: null,
        buddyStatus: "CHILLING",
        hashuuid: hashedUuid,
      };

      console.log("Submitting user details:", userDetails);

      const response = await axios.post("http://localhost:8080/api/deathusers", userDetails, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("User created successfully:", response.data);
      alert(`This is your most important key. Do not share it with anyone other than your beneficiary: ${generatedUuid}`);
      navigate("/death-dashboard");
    } catch (err) {
      console.error("Error submitting form:", err.message);
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Enter Your Details</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { padding: "20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" },
  inputGroup: { marginBottom: "15px" },
  input: { width: "100%", padding: "8px", fontSize: "16px" },
  button: { padding: "10px 20px", backgroundColor: "#007bff", color: "#fff", border: "none", cursor: "pointer" },
};

export default UserDetailsForm;
