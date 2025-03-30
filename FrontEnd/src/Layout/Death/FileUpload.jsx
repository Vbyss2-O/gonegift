import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { enc, AES, PBKDF2, lib } from "crypto-js";

// Supabase configuration
const supabaseUrl = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTM2MTYsImV4cCI6MjA1NTg2OTYxNn0.jcUCVUmUCTlvXhASODoeiPo5Gknk7pE2pYSDFrUTP9Q";
const supabase = createClient(supabaseUrl, supabaseKey);

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(null); // AES key for file
  const [encryptedAesKey, setEncryptedAesKey] = useState(null); // AES key encrypted with UUID
  const [uuid, setUuid] = useState("");
  const [isUuidValid, setIsUuidValid] = useState(false);
 
  //this is for the UUID hashing and checking it is there any hash exist of the same uuid
  const hashWithSalt = async (uuid) => {
    const salt = uuid.substring(0, 16); // Use first 16 characters of UUID as salt
    const text = uuid + salt; 
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };
  

 const validateUuid = async () => {
    try {
      //here token is refering to the uuid itslef 
      const response = await axios.get("http://localhost:8080/api/deathusers/findHashToken", hashWithSalt(currentUser.id) , currentUser.id);
      if (response.status === 200) {
        setIsUuidValid(true);
        setMessage("UUID validated successfully. You can now upload a file.");
      } else {
        setIsUuidValid(false);
        setMessage("Invalid UUID. Please enter a correct one.");
      }
    } catch (error) {
      setIsUuidValid(false);
      setMessage("Validation failed. Please try again.");
    }
  };
  // Generate random UUID, derive AES key, and encrypt it
  const generateKeys = () => {
    //currelty salt is fucked up 
    const salt = hashWithSalt(hashWithSalt(currentUser.id));

    // Derive AES-256 key from UUID using PBKDF2
    const derivedKey = PBKDF2(uuid, salt, {
      keySize: 256 / 32, // 256 bits
      iterations: 10000,  
    }).toString();

    // Encrypt the AES key with the UUID using AES
    const encryptedKey = AES.encrypt(derivedKey, uuid).toString();

    setEncryptionKey(derivedKey);
    setEncryptedAesKey(encryptedKey);

    
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
      console.log("Fetched current user:", user);
      setCurrentUser(user);
      generateKeys(); // Generate keys on login
    } else {
      console.log("No authenticated user found.");
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const encryptFile = (fileData) => {
    if (!encryptionKey) {
      throw new Error("Encryption key not available");
    }

    try {
      const fileWordArray = enc.Base64.parse(
        btoa(
          new Uint8Array(fileData).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        )
      );

      const encryptedData = AES.encrypt(
        fileWordArray.toString(),
        encryptionKey
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

    if (!encryptionKey ||  !encryptedAesKey) {
      setMessage("Encryption setup not ready. Please try again.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const encryptedData = encryptFile(fileData);
      const encryptedBlob = new Blob([encryptedData], {
        type: "image/*, video/mp4",
      });

      const bucket =
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? "media"
          : "letters";

      const uniqueFileName = `${currentUser.id}_${Date.now()}_${
        file.name
      }.enc`;
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

      await axios.post(
        `http://localhost:8080/api/deathusers/sendSecretKey/${currentUser.id}`,
        encryptedAesKey ,
        {
          headers: {
            "Content-Type": "text/plain"
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setMessage(
          "Successfuly encrypted: Please share you serect key with benificary only}",
        );
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
      {/* create a input filed with defalut enter the uuid then add submit button after submit call the hashWithSalt with args uuid */}
      
      <input
        type="text"
        placeholder="Enter UUID"
        value={uuid}
        onChange={(e) => setUuid(e.target.value)}
      />
      <button onClick={validateUuid} disabled={!uuid}>Validate UUID</button>

      <h2>Upload File (AES-256 Encrypted)</h2>
     
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*,video/*,application/pdf"
        disabled={loading || !encryptionKey || !isUuidValid}
      />
      {file && (
        <div style={{ margin: "10px 0" }}>
          <p>
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={loading || !file || !encryptionKey || !isUuidValid}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading || !encryptionKey ? "#6c757d" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading || !encryptionKey ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Encrypting & Uploading..." : "Upload Encrypted File"}
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
