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

  const fetchCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user data:", error);
      return;
    }
    if (user) {
      console.log("Fetched current user:", user);
      setCurrentUser(user);
    } else {
      console.log("No authenticated user found.");
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

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
    if (!currentUser) {
      setMessage("You must be logged in to upload a file.");
      return;
    }

    if (!file) {
      setMessage("Please select a valid file to upload.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Determine bucket based on file type
      const bucket =
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? "media"
          : "letters";

      const uniqueFileName = `${currentUser.id}_${Date.now()}_${file.name}`;
      const filePath = `${currentUser.id}/${uniqueFileName}`;

      // Get the user's JWT token for authenticated requests
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Unable to get user session: " + (sessionError?.message || "No session"));
      }

      console.log("Uploading file as user:", currentUser.id, "to bucket:", bucket);

      // Upload file to Supabase Storage with authenticated token
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error details:", uploadError);
        throw new Error(`Failed to upload to Supabase: ${uploadError.message}`);
      }

      console.log("File uploaded successfully:", uploadData);

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;
      console.log("Public URL:", fileUrl);

      // Prepare metadata for backend
      const fileMetadata = {
        idOfUser: currentUser.id,
        letterFileUrl: bucket === "letters" ? fileUrl : null,
        mediaFileUrl: bucket === "media" ? fileUrl : null,
        usery: {
          userIdX: currentUser.id,
        },
      };

      console.log("Sending metadata to backend:", fileMetadata);

      // Send metadata to backend
      const response = await axios.post(
        "http://localhost:8080/api/filemetadata",
        fileMetadata,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setMessage("File uploaded successfully!");
        setFile(null);
      } else {
        throw new Error("Failed to save file metadata.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(error.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Loading user information...</div>;
  }

  return (
    <div className="file-upload">
      <h2>Upload File</h2>
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*,video/*,application/pdf"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
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