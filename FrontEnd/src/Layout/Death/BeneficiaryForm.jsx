import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"; // Supabase client
import axios from "axios"; // For making HTTP requests

// Supabase configuration
const supabaseUrl = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTM2MTYsImV4cCI6MjA1NTg2OTYxNn0.jcUCVUmUCTlvXhASODoeiPo5Gknk7pE2pYSDFrUTP9Q";
const supabase = createClient(supabaseUrl, supabaseKey);

const BeneficiaryForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user data from Supabase
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user?.user) {
        console.error("Error fetching user:", error);
        return;
      }
      setCurrentUser({
        uid: user.user.id,
        email: user.user.email,
      });
    };
    fetchCurrentUser();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setMessage("You must be logged in to add a beneficiary.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      setMessage("Beneficiary name and email cannot be empty.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post("http://localhost:8080/api/beneficiaries", {
        name,
        email,
        idOfUser: currentUser.uid,
        userx: { userIdX: currentUser.uid },
      });

      if (response.status === 200) {
        setMessage("Beneficiary successfully added!");
        setName("");
        setEmail("");
      } else {
        throw new Error("Failed to add beneficiary");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="beneficiary-form" style={styles.container}>
      <h2 style={styles.title}>Add a Beneficiary</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label htmlFor="name" style={styles.label}>Beneficiary Name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter beneficiary name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>Beneficiary Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter beneficiary email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Adding..." : "Add Beneficiary"}
          </button>
        </div>
      </form>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "500px",
    margin: "0 auto",
    background: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  title: { textAlign: "center", marginBottom: "20px" },
  inputGroup: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "5px", fontWeight: "bold" },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    opacity: "1",
  },
  message: {
    marginTop: "15px",
    color: "green",
    textAlign: "center",
    fontWeight: "bold",
  },
};

export default BeneficiaryForm;
