import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { enc, AES, PBKDF2 } from "crypto-js";
import CryptoJS from "crypto-js";
import "./FileUpload.css";

const supabaseUrl = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTM2MTYsImV4cCI6MjA1NTg2OTYxNn0.jcUCVUmUCTlvXhASODoeiPo5Gknk7pE2pYSDFrUTP9Q";
const supabase = createClient(supabaseUrl, supabaseKey);

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState({ text: null, isSuccess: false });
  const [loading, setLoading] = useState(false);
  const [decryptedKey, setDecryptedKey] = useState(null);
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");
  const [isUuidValid, setIsUuidValid] = useState(false);

  const hashWithSalt = async (x) => {
    const salt = x.substring(0, 16);
    const text = x + salt;
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

  const getEncryptedKey = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/deathusers/getKey/${currentUser.id}`
      );
      if (response.data && typeof response.data === 'string' && response.data.length > 0) {
        return response.data;
      } else {
        throw new Error("Invalid or empty encrypted key from server");
      }
    } catch (error) {
      console.error("Error fetching encrypted key:", error);
      throw error;
    }
  };

  const decryptKey = async (uuid, encryptedKey, ivBase64) => {
    try {
      if (!encryptedKey || !ivBase64) {
        throw new Error("Encrypted key or IV is missing");
      }
      const salt = CryptoJS.SHA256(uuid).toString();
      const derivedKey = CryptoJS.PBKDF2(uuid, salt, {
        keySize: 256 / 32,
        iterations: 10000,
      });
      console.log("Derived Key:", derivedKey.toString());
      const iv = CryptoJS.enc.Base64.parse(ivBase64);
      console.log("IV:", iv);
      const decrypted = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(encryptedKey) }, derivedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      const decryptedKey = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedKey) {
        throw new Error("Decryption resulted in empty key");
      }
      return decryptedKey;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw error;
    }
  };

  const validateUuid = async () => {
    if (!currentUser) {
      setMessage({
        text: "Please wait for user data to load.",
        isSuccess: false,
      });
      return;
    }
    if (!uuid.trim() || !password.trim()) {
      setMessage({
        text: "UUID and password are required.",
        isSuccess: false,
      });
      return;
    }
    setLoading(true);
    try {
      const input = uuid.trim() + "Vedant_Kasar" + password.trim();
      console.log("Input to hashWithSalt:", input);
      const hashedToken = await hashWithSalt(input);
      console.log("Hashed Token:", hashedToken);
      const response = await axios.get(
        `http://localhost:8080/api/deathusers/findHashToken`,
        {
          params: { token: hashedToken, userId: currentUser.id },
        }
      );
      console.log("API Response:", response.data);
      if (response.status === 200) {
        setIsUuidValid(true);
        setMessage({
          text: "UUID validated successfully. You can now upload a file.",
          isSuccess: true,
        });
        const encryptedKey = await getEncryptedKey();
        const derivedKey = await decryptKey(uuid.trim(), encryptedKey, password.trim());
        setDecryptedKey(derivedKey);
      } else {
        setIsUuidValid(false);
        setMessage({
          text: "Invalid UUID or password. Please check and try again.",
          isSuccess: false,
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      setIsUuidValid(false);
      if (error.response && error.response.status === 404) {
        setMessage({
          text: "Validation endpoint not found. Please ensure the server is running and the URL is correct.",
          isSuccess: false,
        });
      } else {
        setMessage({
          text: `Validation failed: ${error.message || "Please try again."}`,
          isSuccess: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const encryptFile = async (fileData) => {
    if (!decryptedKey) {
      throw new Error("Decryption key not available");
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
        decryptedKey
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
        setMessage({
          text: "Invalid file type. Please upload an image, video, or PDF.",
          isSuccess: false,
        });
        return;
      }
      setFile(selectedFile);
      setMessage({ text: null, isSuccess: false });
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setMessage({
        text: "You must be logged in to upload a file.",
        isSuccess: false,
      });
      return;
    }
    if (!file) {
      setMessage({
        text: "Please select a valid file to upload.",
        isSuccess: false,
      });
      return;
    }
    if (!decryptedKey) {
      setMessage({
        text: "Encryption setup not ready. Please validate your UUID first.",
        isSuccess: false,
      });
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
      const bucket =
        file.type && (file.type.startsWith("image/") || file.type.startsWith("video/"))
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
      const fileUrl = publicUrlData?.publicUrl;
      if (!fileUrl) {
        throw new Error("Failed to retrieve file URL from Supabase");
      }
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
          isSuccess: true,
        });
        setFile(null);
      } else {
        throw new Error("Failed to save file metadata.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        text: error.message || "Failed to upload file",
        isSuccess: false,
      });
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
          <label className="uuid-label">UUID</label>
          <input
            type="text"
            placeholder="Enter UUID"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            className="uuid-input"
            disabled={loading}
          />
          <label className="password-label">PASSWORD</label>
          <input
            type="text"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
            disabled={loading}
          />
        </div>
        <button
          onClick={validateUuid}
          disabled={!uuid || !currentUser || loading}
          className={`validate-button ${loading ? "loading" : ""}`}
        >
          Validate Secrects
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
            disabled={loading || !file || !isUuidValid || !decryptedKey}
            className={`upload-button ${loading ? "loading" : ""}`}
          >
            {loading ? "Encrypting & Uploading..." : "Upload Encrypted File"}
          </button>
        </div>
      </div>
      {message.text && (
        <p
          className={`status-message ${
            message.isSuccess ? "success" : "error"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
};

export default FileUpload;