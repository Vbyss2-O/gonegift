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
        <br />
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
    //shift this container little bit low
    bottom : "-80px",
    padding: "2rem",
    maxWidth: "700px",
    margin: "0 auto",
    height: "500px",
    background: "var(--bg-glass)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-rainbow)",
    backdropFilter: "var(--blur-light)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
    transition: "var(--transition-spring)",
  },

  title: {
    textAlign: "center",
    marginBottom: "2rem",
    fontSize: "2rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, var(--primary), var(--secondary), var(--accent))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-1px",
  },

  inputGroup: {
    marginBottom: "1.5rem",
    position: "relative",
    transition: "var(--transition)",
  },

  label: {
    display: "block",
    marginBottom: "0.75rem",
    fontWeight: "600",
    color: "var(--text-primary)",
    fontSize: "1rem",
    letterSpacing: "0.5px",
  },

  input: {
    width: "100%",
    padding: "1rem 1.25rem",
    fontSize: "1rem",
    backgroundColor: "var(--bg-glass)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "var(--radius-lg)",
    boxSizing: "border-box",
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

  button: {
    padding: "1rem 2rem",
    fontSize: "1rem",
    fontWeight: "600",
    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
    color: "var(--text-light)",
    border: "none",
    borderRadius: "var(--radius-lg)",
    cursor: "pointer",
    transition: "var(--transition-spring)",
    boxShadow: "var(--shadow-md)",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: "var(--shadow-lg)",
    },
    "&:active": {
      transform: "translateY(-1px)",
    },
    "&::before": {
      content: "''",
      position: "absolute",
      top: "0",
      left: "-100%",
      width: "100%",
      height: "100%",
      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
      transition: "var(--transition)",
    },
    "&:hover::before": {
      left: "100%",
    },
  },

  message: {
    marginTop: "1.5rem",
    padding: "1rem",
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "1rem",
    background: "var(--bg-glass)",
    color: "var(--accent3)",
    backdropFilter: "var(--blur-light)",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    animation: "fadeInUp 0.5s ease-out",
  },

  // Add these additional styles for enhanced effects
  "@keyframes fadeInUp": {
    from: {
      opacity: "0",
      transform: "translateY(10px)",
    },
    to: {
      opacity: "1",
      transform: "translateY(0)",
    },
  },

  // Add media queries for responsiveness
  "@media (max-width: 768px)": {
    container: {
      padding: "1.5rem",
      margin: "1rem",
    },
    title: {
      fontSize: "1.75rem",
    },
    button: {
      padding: "0.875rem 1.75rem",
    },
  },

  "@media (max-width: 480px)": {
    container: {
      padding: "1.25rem",
      margin: "0.75rem",
    },
    title: {
      fontSize: "1.5rem",
    },
    input: {
      padding: "0.875rem 1rem",
    },
    button: {
      padding: "0.75rem 1.5rem",
    },
  },
};

export default BeneficiaryForm;
