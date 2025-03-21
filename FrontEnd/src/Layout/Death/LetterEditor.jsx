import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTM2MTYsImV4cCI6MjA1NTg2OTYxNn0.jcUCVUmUCTlvXhASODoeiPo5Gknk7pE2pYSDFrUTP9Q";
const supabase = createClient(supabaseUrl, supabaseKey);

const LetterEditor = () => {
  const [letterTitle, setLetterTitle] = useState("");
  const [letterContent, setLetterContent] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        console.log("Fetched current user:", user);
        setCurrentUser(user);
      } else {
        console.log("No authenticated user found.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setMessage("Error fetching user data");
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      setMessage("You must be logged in to save a letter.");
      return;
    }

    if (!letterTitle || !letterContent) {
      setMessage("Please enter a title and content for the letter.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Create a file from the letter content
      const fileName = `${letterTitle.replace(/\s+/g, "_")}_${Date.now()}.html`;
      const file = new Blob([letterContent], { type: "text/html" });
      
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file, fileName);
      formData.append('idOfUser', currentUser.id);

      // Send to backend
      const response = await axios.post(
        'http://localhost:8080/api/files/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (response.data) {
        setMessage('Letter saved successfully!');
        setLetterTitle("");
        setLetterContent("");
      }
    } catch (error) {
      console.error('Error saving letter:', error);
      setMessage(`Error saving letter: ${error.response?.data || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Please log in to create letters.</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.editorContainer}>
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={letterTitle}
            onChange={(e) => setLetterTitle(e.target.value)}
            placeholder="Enter letter title"
            style={styles.input}
          />
        </div>

        <ReactQuill
          value={letterContent}
          onChange={setLetterContent}
          style={styles.quill}
          theme="snow"
        />

        <div style={styles.buttonContainer}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              ...styles.saveButton,
              ...(loading ? styles.saveButtonDisabled : {}),
            }}
          >
            {loading ? "Saving..." : "Save Letter"}
          </button>
        </div>
      </div>

      {message && (
        <p
          style={
            message.includes("success") ? styles.successMessage : styles.errorMessage
          }
        >
          {message}
        </p>
      )}
    </div>
  );
};
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  editorContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  inputGroup: {
    marginBottom: "1rem",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    border: "2px solid #e1e1e1",
    borderRadius: "8px",
    transition: "border-color 0.3s ease",
    outline: "none",
  },
  quill: {
    height: "300px",
    marginBottom: "15px",
    border: "2px solid #e1e1e1",
    borderRadius: "8px",
    overflow: "hidden",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "1.5rem",
  },
  saveButton: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  saveButtonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  successMessage: {
    marginTop: "1rem",
    padding: "12px",
    backgroundColor: "#d4edda",
    color: "#155724",
    borderRadius: "6px",
    textAlign: "center",
    fontWeight: "bold",
  },
  errorMessage: {
    marginTop: "1rem",
    padding: "12px",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    borderRadius: "6px",
    textAlign: "center",
    fontWeight: "bold",
  },
};

export default LetterEditor;