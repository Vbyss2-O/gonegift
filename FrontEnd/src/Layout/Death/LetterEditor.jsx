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
    margin: "2rem auto",
    padding: "2.5rem",
    background: "var(--bg-glass)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-rainbow)",
    backdropFilter: "var(--blur-light)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
    transition: "var(--transition-spring)",
    "&::before": {
      content: "''",
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "4px",
      background: "var(--border-gradient)",
      backgroundSize: "200% 200%",
      animation: "gradientMove 3s linear infinite",
    }
  },

  editorContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    position: "relative",
    zIndex: "1",
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
    }
  },

  quill: {
    height: "300px",
    marginBottom: "1.5rem",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    background: "var(--bg-glass)",
    backdropFilter: "var(--blur-light)",
    boxShadow: "var(--shadow-sm)",
    transition: "var(--transition)",
    "&:hover": {
      boxShadow: "var(--shadow-md)",
    },
    "& .ql-toolbar": {
      border: "none",
      borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
      background: "var(--bg-glass)",
    },
    "& .ql-container": {
      border: "none",
      background: "var(--bg-white)",
    }
  },

  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "2rem",
    gap: "1rem",
  },

  saveButton: {
    padding: "1rem 2rem",
    fontSize: "1rem",
    fontWeight: "600",
    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
    color: "var(--text-light)",
    border: "none",
    borderRadius: "var(--radius-lg)",
    cursor: "pointer",
    transition: "var(--transition-spring)",
    position: "relative",
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
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
    "&:hover:not(:disabled)": {
      transform: "translateY(-2px)",
      boxShadow: "var(--shadow-xl)",
      "&::before": {
        left: "100%",
      }
    },
    "&:active:not(:disabled)": {
      transform: "translateY(-1px)",
    }
  },

  saveButtonDisabled: {
    background: "linear-gradient(135deg, var(--text-gray), #999)",
    opacity: "0.7",
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
  },

  successMessage: {
    marginTop: "1.5rem",
    padding: "1rem",
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))",
    color: "var(--accent3)",
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
    fontWeight: "600",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    animation: "fadeInUp 0.5s ease-out",
  },

  errorMessage: {
    marginTop: "1.5rem",
    padding: "1rem",
    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
    color: "var(--accent4)",
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
    fontWeight: "600",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    animation: "fadeInUp 0.5s ease-out",
  },

  "@media (max-width: 768px)": {
    container: {
      margin: "1.5rem",
      padding: "2rem",
    },
    quill: {
      height: "250px",
    }
  },

  "@media (max-width: 480px)": {
    container: {
      margin: "1rem",
      padding: "1.5rem",
    },
    buttonContainer: {
      flexDirection: "column",
    },
    saveButton: {
      width: "100%",
    }
  }
};


export default LetterEditor;