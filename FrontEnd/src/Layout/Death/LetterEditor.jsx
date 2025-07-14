import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { supabase } from "./supabaseClient"; // Import your Supabase client
import axios from "axios";
import CryptoJS from "crypto-js";
import BackButton from "../components/BackButton"; // Import the BackButton component

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
  const [accessToken , setAccessToken] = useState(null);

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

  useEffect(() => {
  const initAuth = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return;
    }

    const accessToken = data.session?.access_token;

    if (accessToken) {
      setAccessToken(accessToken);
    } else {
      console.warn("No access token found—user probably signed out.");
    }
  };

  initAuth();
}, []);

  const fetchCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user data:", error);
      return;
    }
    if (user) {
      setCurrentUser(user);
    } else {
    }
  };

  const getEncryptedKey = async (userId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/deathusers/getKey/${userId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                 },
              }
        
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
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/deathusers/findHashToken/${hashedToken}`,
        {
          headers:{Authorization: `Bearer ${accessToken}`},
        }
      );
      if (response.status === 200) {
        console.log("Ok");
        setIsUuidValid(true);
        const encryptedKeyData = await getEncryptedKey(currentUser.id);
        console.log("ok1")
        const derivedKey = await decryptKey(
          uuid.trim(),
          encryptedKeyData,
          password.trim()
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
      const cleanTitle = letterTitle.replace(/[\/\\]/g, "_").replace(/\s+/g, "_");
      const fileName = `${cleanTitle}_${Date.now()}.html.enc`;

      const file = new Blob([encryptedContent], { type: "text/plain" });
      const bucket = "letters";
      const filePath = `${currentUser.id}/${fileName}`;

      // Get user session for authenticated upload
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Unable to get user session: " + (sessionError?.message || "No session"));
      }


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


      // Get public URL for the uploaded file


      // Prepare metadata for backend
      const fileMetadata = {
        idOfUser: currentUser.id,
        letterFileUrl: filePath,
        mediaFileUrl: null,
        voiceFileUrl: null,
        fileName: letterTitle,
        usery: {
          userIdX: currentUser.id,
        },
      };


      // Send metadata to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/filemetadata`,
        fileMetadata,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
             
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
    <>
      <BackButton />
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
    </>
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
    display: "block", // Ensures it behaves like a block element for centering
    marginLeft: "auto", // Centers the button horizontally
    marginRight: "auto", // Centers the button horizontally
    maxWidth: "fit-content", // Allows button to size to its content
    boxShadow: "var(--shadow-md)", // Added shadow for visibility
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "var(--shadow-lg)", // Stronger shadow on hover
      background: "linear-gradient(135deg, #0d9263, #22c55e)", // Slightly darker green on hover
    },
    "&:active": {
      transform: "translateY(-1px)",
    },
  },
  validateButtonDisabled: {
    background: "linear-gradient(135deg, #6b7280, #9ca3af)",
    opacity: 0.7,
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
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
    overflow: "hidden", // Re-added overflow: hidden
    transition: "all 0.3s ease",
    "&::before": { // Re-added the top gradient line
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
    justifyContent: "center", // centers horizontally
    alignItems: "center",     // centers vertically (if there is height)
    marginTop: "2rem",
    gap: "1rem",
    flexWrap: "wrap", // Allow buttons to wrap on smaller screens
  },
  saveButton: {
    padding: "1rem 2rem",
    fontSize: "1rem",
    fontWeight: "600",
    background: "linear-gradient(135deg, var(--accent),rgb(99, 208, 172))", // Changed to green gradient
    color: "var(--text-white)", // Changed to white for better visibility
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
    "&:hover": { // Changed from :hover:not(:disabled) to just :hover for simplicity in inline styles, assuming disabled state is handled by the disabled prop
      transform: "translateY(-3px)", // Increased lift on hover
      boxShadow: "var(--shadow-xl)", // Stronger shadow on hover
      background: "linear-gradient(135deg, #0d9263, #22c55e)", // Darker green gradient on hover
      "&::before": {
        left: "100%",
      },
    },
    "&:active": {
      transform: "translateY(-1px)",
    },
  },
  saveButtonDisabled: {
    background: "linear-gradient(135deg, var(--text-light), var(--text-muted))", // Reverted to user's original disabled gradient
    opacity: "0.7",
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
  },
  successMessage: {
    marginTop: "1.5rem",
    padding: "1rem",
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))",
    color: "var(--accent)", // Changed to accent for success color
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
    fontWeight: "600",
    border: "1px solid rgba(var(--accent-rgb), 0.3)",
    animation: "fadeInUp 0.5s ease-out",
  },
  errorMessage: {
    marginTop: "1.5rem",
    padding: "1rem",
    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
    color: "var(--accent2)", // Changed to accent2 for error color
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
    fontWeight: "600",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    animation: "fadeInUp 0.5s ease-out",
  },
  // Keyframes for animations (these typically need to be injected globally or handled by a CSS-in-JS library)
  "@keyframes gradientMove": {
    "0%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
    "100%": { backgroundPosition: "0% 50%" },
  },
  "@keyframes fadeInUp": {
    from: {
      opacity: 0,
      transform: "translateY(10px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },

  // Responsive Styles (using media queries as nested objects)
  "@media (max-width: 768px)": {
    container: {
      margin: "1.5rem",
      padding: "2rem",
      // Reverted mobile full-page styling to be consistent with original provided styles
      maxWidth: "800px", // Keep max-width for consistency
      minHeight: "500px", // Keep min-height for consistency
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-rainbow)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      overflow: "hidden", // Re-added overflow: hidden for consistency
    },
    quill: {
      height: "250px",
    },
    buttonContainer: {
      flexDirection: "column",
      gap: "1rem", // Keep original gap for consistency
    },
    saveButton: {
      width: "100%",
      padding: "1rem 2rem", // Keep original padding for consistency
      fontSize: "1rem", // Keep original font-size for consistency
    },
    validateButton: { // Apply full width and centering for validate button on mobile
      width: "100%",
      display: "block",
      marginLeft: "auto",
      marginRight: "auto",
      maxWidth: "100%", // Ensure it takes full width on mobile
      padding: "0.75rem 1.5rem", // Keep original padding for consistency
      fontSize: "1rem", // Keep original font-size for consistency
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
    validateButton: { // Apply full width and centering for validate button on very small mobile
      width: "100%",
      display: "block",
      marginLeft: "auto",
      marginRight: "auto",
      maxWidth: "100%",
    },
  },
  // Added media query for tablets to ensure styles are applied correctly
  "@media (min-width: 769px) and (max-width: 1024px)": {
    container: {
      maxWidth: "700px",
      padding: "2rem",
      margin: "0 auto",
    },
    quill: {
      height: "250px",
    },
    saveButton: {
      padding: "1rem 2rem",
      fontSize: "1rem",
    },
    validateButton: {
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
    },
  },
  // Added media query for desktop to ensure styles are applied correctly
  "@media (min-width: 1025px)": {
    container: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "2.5rem",
    },
    quill: {
      height: "300px",
    },
    saveButton: {
      padding: "1rem 2rem",
      fontSize: "1rem",
    },
    validateButton: {
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
    },
  },
};

export default LetterEditor;