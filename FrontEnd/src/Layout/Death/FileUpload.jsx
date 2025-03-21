import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTM2MTYsImV4cCI6MjA1NTg2OTYxNn0.jcUCVUmUCTlvXhASODoeiPo5Gknk7pE2pYSDFrUTP9Q";
const supabase = createClient(supabaseUrl, supabaseKey);

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
        "application/pdf",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage("Invalid file type. Please upload an image, video, or PDF.");
        return;
      }

      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (!file || !currentUser) {
      setMessage('Please select a file and ensure you are logged in.');
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('idOfUser', currentUser.id);

    try {
      const response = await axios.post('http://localhost:8080/api/files/upload', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (response.data) {
        setMessage('File uploaded successfully! URL: ' + 
          (response.data.letterFileUrl || response.data.mediaFileUrl));
        setFile(null);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage(`Error uploading file: ${error.response?.data || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Please log in to upload files.</div>;
  }

  return (
    <div className="file-upload">
      <h2>Upload File</h2>
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*,video/*,application/pdf"
        disabled={loading}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading || !file ? "not-allowed" : "pointer",
          opacity: loading || !file ? 0.7 : 1,
        }}
      >
        {loading ? "Uploading..." : "Upload File"}
      </button>
      {message && (
        <p
          style={{
            marginTop: "10px",
            color: message.includes("success") ? "green" : "red",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default FileUpload;