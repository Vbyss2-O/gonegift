import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import CryptoJS from "crypto-js";

const supabaseUrl = "https://nzdfurdfnrlhgqhhdogd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGZ1cmRmbnJsaGdxaGhkb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTM2MTYsImV4cCI6MjA1NTg2OTYxNn0.jcUCVUmUCTlvXhASODoeiPo5Gknk7pE2pYSDFrUTP9Q";
const supabase = createClient(supabaseUrl, supabaseKey);

const LetterEditor = () => {
  const [letterTitle, setLetterTitle] = useState("");
  const [letterContent, setLetterContent] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");
  const [isUuidValid, setIsUuidValid] = useState(false);
  const [decryptedKey, setDecryptedKey] = useState(null);

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

  const getEncryptedKey = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/deathusers/getKey/${userId}`
      );
      if (response.status === 200) {
        return response.data; // Assume { ciphertext: "...", iv: "..." }
      } else {
        throw new Error("No encrypted key found.");
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
      const iv = CryptoJS.enc.Base64.parse(ivBase64);
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(encryptedKey) },
        derivedKey,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );
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
      setMessage("Please wait for user data to load.");
      return;
    }
    if (!uuid.trim() || !password.trim()) {
      setMessage("UUID and password are required.");
      return;
    }
    setLoading(true);
    try {
      const input = uuid.trim() + "Vedant_Kasar" + password.trim();
      const hashedToken = await hashWithSalt(input);
      console.log("Hashed Token:", hashedToken);
      const response = await axios.get(
        `http://localhost:8080/api/deathusers/findHashToken/${hashedToken}`
      );
      if (response.status === 200) {
        setIsUuidValid(true);
        const encryptedKeyData = await getEncryptedKey(currentUser.id);
        const derivedKey = await decryptKey(
          uuid.trim(),
          encryptedKeyData,
          password
        );
        setDecryptedKey(derivedKey);
        setMessage("UUID validated successfully. You can now save the letter.");
      } else {
        setIsUuidValid(false);
        setMessage("Invalid UUID or password. Please try again.");
      }
    } catch (error) {
      console.error("Validation error:", error);
      setIsUuidValid(false);
      setMessage(`Validation failed: ${error.message || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const encryptLetter = async (content) => {
    if (!decryptedKey) {
      throw new Error("Decrypted AES key not available");
    }
    try {
      const encryptedData = CryptoJS.AES.encrypt(
        content,
        decryptedKey
      ).toString();
      return encryptedData;
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Letter encryption failed");
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
    if (!isUuidValid || !decryptedKey) {
      setMessage("Please validate UUID and password first.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      // Encrypt the letter content
      const encryptedContent = await encryptLetter(letterContent);
      
      // Convert encrypted content to a Blob
      const fileName = `${letterTitle.replace(/\s+/g, "_")}_${Date.now()}.html.enc`;
      const file = new Blob([encryptedContent], { type: "text/plain" });
      const bucket = "letters";
      const filePath = `${currentUser.id}/${fileName}`;

      // Get user session for authenticated upload
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Unable to get user session: " + (sessionError?.message || "No session"));
      }

      console.log("Saving encrypted letter as user:", currentUser.id, "to bucket:", bucket);

      // Upload the encrypted letter to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "text/plain",
        });

      if (uploadError) {
        console.error("Supabase upload error details:", uploadError);
        throw new Error(`Failed to upload to Supabase: ${uploadError.message}`);
      }

      console.log("Encrypted letter uploaded successfully:", uploadData);

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;
      console.log("Public URL:", fileUrl);

      // Prepare metadata for backend
      const fileMetadata = {
        idOfUser: currentUser.id,
        letterFileUrl: fileUrl,
        mediaFileUrl: null,
        voiceFileUrl: null,
        fileName: letterTitle,
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
        setMessage("Letter saved successfully!");
        setLetterTitle("");
        setLetterContent("");
        setUuid("");
        setPassword("");
        setIsUuidValid(false);
        setDecryptedKey(null);
      } else {
        throw new Error("Failed to save letter metadata.");
      }
    } catch (error) {
      console.error("Save error:", error);
      setMessage(error.message || "Failed to save letter");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Loading user information...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto" }}>
      <div style={styles.uuidSection}>
        <div style={styles.uuidContainer}>
          <label style={styles.label}>UUID</label>
          <input
            type="text"
            placeholder="Enter UUID"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
        </div>
        <button
          onClick={validateUuid}
          disabled={!uuid || !password || loading}
          style={{
            ...styles.validateButton,
            ...(loading ? styles.validateButtonDisabled : {}),
          }}
        >
          {loading ? "Validating..." : "Validate Secrets"}
        </button>
      </div>
      <div style={styles.container}>
        <div style={styles.editorContainer}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={letterTitle}
              onChange={(e) => setLetterTitle(e.target.value)}
              placeholder="Enter letter title"
              style={styles.input}
              disabled={!isUuidValid}
            />
          </div>

          <ReactQuill
            value={letterContent}
            onChange={setLetterContent}
            style={styles.quill}
            theme="snow"
            readOnly={!isUuidValid}
          />

          <div style={styles.buttonContainer}>
            <button
              onClick={handleSave}
              disabled={loading || !isUuidValid || !decryptedKey}
              style={{
                ...styles.saveButton,
                ...(loading || !isUuidValid || !decryptedKey ? styles.saveButtonDisabled : {}),
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
    </div>
  );
};

const styles = {
  uuidSection: {
    marginBottom: "2rem",
    padding: "1.5rem",
    background: "var(--bg-glass)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  uuidContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    fontSize: "1rem",
    fontWeight: "500",
    color: "var(--text-primary)",
  },
  validateButton: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "600",
    background: "linear-gradient(135deg, #10b981, #34d399)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-lg)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "1rem",
  },
  validateButtonDisabled: {
    background: "linear-gradient(135deg, #6b7280, #9ca3af)",
    opacity: 0.7,
    cursor: "not-allowed",
  },
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2.5rem",
    background: "var(--bg-glass)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-rainbow)",
    backdropFilter: "var(--blur-light)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
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
    },
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
    transition: "all 0.3s ease",
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
  quill: {
    height: "300px",
    marginBottom: "1.5rem",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    background: "var(--bg-glass)",
    backdropFilter: "var(--blur-light)",
    boxShadow: "var(--shadow-sm)",
    transition: "all 0.3s ease",
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
    },
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
    transition: "all 0.3s ease",
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
      transition: "all 0.3s ease",
    },
    "&:hover:not(:disabled)": {
      transform: "translateY(-2px)",
      boxShadow: "var(--shadow-xl)",
      "&::before": {
        left: "100%",
      },
    },
    "&:active:not(:disabled)": {
      transform: "translateY(-1px)",
    },
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
    },
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
    },
  },
};

export default LetterEditor;