import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { enc, AES, PBKDF2 } from "crypto-js";
import CryptoJS from "crypto-js";
import "./FileUpload.css";

const supabaseUrl = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTM2MTYsImV4cCI6MjA1NTg2OTYxNn0.jcUCVUmUCTlvXhASODoeiPo5Gknk7pE2pYSDFrUTP9Q";
const supabase = createClient(supabaseUrl, supabaseKey);

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState({ text: null, isSuccess: false });
  const [loading, setLoading] = useState(false);
  const [AesKey, setAesKey] = useState(null);
  const [uuid, setUuid] = useState("");
  const [isUuidValid, setIsUuidValid] = useState(false);

  const hashWithSalt = async (uuid) => {
    const salt = uuid.substring(0, 16);
    const text = uuid + salt;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const fetchCurrentUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user data:", error);
      return;
    }
    if (user) {
      setCurrentUser(user);
      return user;
    }
    return null;
  };

  const validateUuid = async () => {
    if (!currentUser) {
      setMessage({ text: "Please wait for user data to load.", isSuccess: false });
      return;
    }
    
    try {
      const hashedToken = await hashWithSalt(uuid);
      const response = await axios.get(
        `http://localhost:8080/api/deathusers/findHashToken`,
        {
          params: { token: hashedToken, userId: currentUser.id },
        }
      );
      
      if (response.status === 200) {
        setIsUuidValid(true);
        setMessage({ text: "UUID validated successfully. You can now upload a file.", isSuccess: true });
        
        // Generate AES key directly from UUID
        const salt = CryptoJS.SHA256(uuid).toString();
        const derivedKey = CryptoJS.PBKDF2(uuid, salt, {
          keySize: 256/32,
          iterations: 10000,
        }).toString(CryptoJS.enc.Hex);
        
        setAesKey(derivedKey);
      } else {
        setIsUuidValid(false);
        setMessage({ text: "Invalid UUID. Please enter a correct one.", isSuccess: false });
      }
    } catch (error) {
      console.error("Validation error:", error);
      setIsUuidValid(false);
      setMessage({ text: "Validation failed. Please try again.", isSuccess: false });
    }
  };

  const encryptFile = async (fileData) => {
    if (!AesKey) {
      throw new Error("Encryption key not available");
    }

    try {
      const base64 = btoa(
        new Uint8Array(fileData).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      const fileWordArray = enc.Base64.parse(base64);
      const encryptedData = AES.encrypt(
        fileWordArray.toString(),
        AesKey
      ).toString();
      return encryptedData;
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("File encryption failed");
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
        setMessage({ text: "Invalid file type. Please upload an image, video, or PDF.", isSuccess: false });
        return;
      }

      setFile(selectedFile);
      setMessage({ text: null, isSuccess: false });
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setMessage({ text: "You must be logged in to upload a file.", isSuccess: false });
      return;
    }

    if (!file) {
      setMessage({ text: "Please select a valid file to upload.", isSuccess: false });
      return;
    }

    if (!AesKey) {
      setMessage({ text: "Encryption setup not ready. Please validate your UUID first.", isSuccess: false });
      return;
    }

    setLoading(true);
    setMessage({ text: null, isSuccess: false });

    try {
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const encryptedData = await encryptFile(fileData);
      const encryptedBlob = new Blob([encryptedData], {
        type: file.type,
      });

      const bucket = file.type.startsWith("image/") || file.type.startsWith("video/")
        ? "media"
        : "letters";

      const uniqueFileName = `${currentUser.id}_${Date.now()}_${file.name}.enc`;
      const filePath = `${currentUser.id}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, encryptedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: null,
        });

      if (uploadError) {
        throw new Error(`Failed to upload to Supabase: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      const fileMetadata = {
        idOfUser: currentUser.id,
        letterFileUrl: bucket === "letters" ? fileUrl : null,
        mediaFileUrl: bucket === "media" ? fileUrl : null,
        fileName: file.name,
        usery: {
          userIdX: currentUser.id,
        },
      };

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
        setMessage({
          text: "Successfully encrypted: Please share your secret key with beneficiary only",
          isSuccess: true
        });
        setFile(null);
      } else {
        throw new Error("Failed to save file metadata.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ text: error.message || "Failed to upload file", isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  if (!currentUser) {
    return <div className="no-auth">Loading user data...</div>;
  }

  return (
    <div className="file-upload">
      <h2>Upload File</h2>
      <div className="uuid-section">
        <div className="uuid-container">
          <input
            type="text"
            placeholder="Enter UUID"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            className="uuid-input"
            disabled={loading}
          />
          <label className="uuid-label">UUID</label>
        </div>
        <button
          onClick={validateUuid}
          disabled={!uuid || !currentUser || loading}
          className={`validate-button ${loading ? "loading" : ""}`}
        >
          Validate UUID
        </button>
      </div>
      <div className="upload-section">
        <div className="upload-zone">
          <span className="upload-zone-icon">📤</span>
          <p className="upload-zone-text">
            {file
              ? `Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
              : "Drag & drop or click to upload an image, video, or PDF"}
          </p>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/*,application/pdf"
            disabled={loading || !isUuidValid}
          />
        </div>
        <div className="button-container">
          <button
            onClick={handleSubmit}
            disabled={loading || !file || !isUuidValid || !AesKey}
            className={`upload-button ${loading ? "loading" : ""}`}
          >
            {loading ? "Encrypting & Uploading..." : "Upload Encrypted File"}
          </button>
        </div>
      </div>
      {message.text && (
        <p className={`status-message ${message.isSuccess ? "success" : "error"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default FileUpload;