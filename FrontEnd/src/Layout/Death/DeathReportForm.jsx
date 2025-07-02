import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DragNdrop from "../components/DragNDrop";

const DeathReportForm = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [secretId, setSecretId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUuidValid, setIsUuidValid] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Error fetching user:", error?.message);
        navigate("/login");
        return;
      }
      setCurrentUser(user);
    };
    fetchUser();
  }, [navigate]);

  const validateUuid = async () => {
    if (!currentUser) {
      setMessage("Please wait for user data to load.");
      return;
    }
    if (!secretId.trim() || !password.trim()) {
      setMessage("UUID and password are required.");
      return;
    }

    setLoading(true);
    try {
      const input = secretId.trim() + "Vedant_Kasar" + password.trim();
      const hashedToken = await hashWithSalt(input);
      const response = await axios.get(
        `http://localhost:8080/api/deathusers/findHashToken`,
        {
          params: { token: hashedToken, userId: currentUser.id },
        }
      );
      if (response.status === 200) {
        setIsUuidValid(true);
        setMessage("UUID validated successfully. You can now upload a file.");
        
      } else {
        setIsUuidValid(false);
        setMessage("Invalid UUID or password. Please check and try again.");
      }
    } catch (error) {
      console.error("Validation error:", error);
      setIsUuidValid(false);
      if (error.response && error.response.status === 404) {
        setMessage("Validation endpoint not found or invalid UUID/password.");
      } else {
        setMessage(`Validation failed: ${error.message || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setMessage("You must be logged in to report a death.");
      return;
    }
    if (!secretId || !name || !surname || !file) {
      setMessage("Please fill in all required fields and upload a death certificate.");
      return;
    }

    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const bucket = "report";
      const uniqueFileName = `${currentUser.id}_${Date.now()}_${file.name}`;
      const filePath = `${currentUser.id}/${uniqueFileName}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Failed to upload to Supabase: ${uploadError.message}`);
      }

     
    

      const reportData = {
        secretId,
        password,
        filePath,
        name,
        surname,
        reportDetails: reportDetails || null,
        status: "pending",
      };

      await axios.post("http://localhost:8080/api/death-reports", reportData, {
        headers: { "Content-Type": "application/json" },
      });

      setMessage("Death report submitted successfully!");
      setSecretId("");
      setPassword("");
      setName("");
      setSurname("");
      setReportDetails("");
      setFile(null);
      setIsUuidValid(false);
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
      <h2 style={styles.header}>Report a Death</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>ID</label>
          <input
            type="text"
            value={secretId}
            onChange={(e) => setSecretId(e.target.value)}
            placeholder="Enter the secret ID (UUID)"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter the Password"
            style={styles.input}
            required
          />
        </div>

        {!isUuidValid && (
          <button
            type="button"
            onClick={validateUuid}
            disabled={loading}
            style={{ ...styles.button, background: "#4f46e5" }}
          >
            {loading ? "Validating..." : "Validate UUID"}
          </button>
        )}

        <fieldset disabled={!isUuidValid} style={{ border: "none", padding: 0 }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
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
            <label style={styles.label}>Surname</label>
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
            <label style={styles.label}>Details</label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Provide any additional details"
              style={styles.textarea}
            />
          </div>
          <div>
            <label style={styles.label}>Upload Death Certificate</label>
            <div>
              <DragNdrop onFilesSelected={setFile} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </fieldset>
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
    maxWidth: "650px",
    margin: "2rem auto",
    background: "#ffffffcc",
    borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
  },
  header: {
    color: "#1f2937",
    fontSize: "1.75rem",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  inputGroup: {
    marginBottom: "1.25rem",
  },
  label: {
    color: "#374151",
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "0.5rem",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#f9fafb",
    transition: "border-color 0.3s ease",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    minHeight: "120px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#f9fafb",
    resize: "vertical",
  },
  button: {
    padding: "1rem 2rem",
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginTop: "1rem",
    transition: "background 0.3s ease",
  },
  success: {
    color: "#047857",
    backgroundColor: "#d1fae5",
    border: "1px solid #10b981",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1.25rem",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    border: "1px solid #ef4444",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1.25rem",
  },
};

export default DeathReportForm;
