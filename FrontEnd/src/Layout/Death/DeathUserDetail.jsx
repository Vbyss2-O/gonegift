import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { enc, AES, PBKDF2 } from "crypto-js";
import CryptoJS from "crypto-js";


const UserDetailsForm = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastname, setLastname] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(true);  // Added for initial loading state
  const [user, setUser] = useState(null);
  const [middleName , setMiddleName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");


  // Check if user is logged in, if not redirect to login
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          console.error("User not found or error:", error?.message || "No user found");
          navigate("/login");
        } else {
          setUser(data.user);  // Save full user object
          setLoadingScreen(false); // Show form after loading completes
        }
      } catch (err) {
        console.error("Error in checkUser:", err.message);
        navigate("/login");
      }
    };
    checkUser();
  }, [navigate]);



  // Hashing function using crypto.subtle API
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

  const generateKeysWithEncryption = (uuid) => {
    try {
      // 1. Generate salt from UUID (SHA256)
      const salt = CryptoJS.SHA256(uuid).toString();

      // 2. Derive a 256-bit key using PBKDF2
      const derivedKey = CryptoJS.PBKDF2(uuid, salt, {
        keySize: 256 / 32,
        iterations: 10000,
      });

      // 3. Generate a random IV (Initialization Vector)
      const iv = CryptoJS.lib.WordArray.random(16);

      // 4. Encrypt the derived key itself as string
      const encrypted = CryptoJS.AES.encrypt(
        derivedKey.toString(CryptoJS.enc.Hex), // Data to encrypt
        derivedKey,                            // Use derived key as encryption key
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      // 5. Return both encrypted value and IV as Base64 (needed for decryption)
      return {
        encryptedKey: encrypted.toString(),       // Base64 string
        iv: iv.toString(CryptoJS.enc.Base64),     // Also Base64 string
      };

    } catch (error) {
      console.error('Key generation/encryption failed:', error);
      throw error;
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const generatedUuid = uuidv4();
      const email = user.email;



      // Get the encrypted key directly from the function
      const { encryptedKey, iv } = generateKeysWithEncryption(generatedUuid);
      const hashedUuid = await hashWithSalt(generatedUuid.trim() + "Vedant_Kasar" + iv.trim());

      const userDetails = {
        userIdX: user.id,
        email: email,
        firstName: firstName,
        middleName : middleName,
        lastname: lastname,
        dateOfBirth: dateOfBirth,
        lastActivityDate: new Date().toISOString(),
        inactivityThresholdDays: 0,
        userRole: "general",
        isdeceased: false,
        attemptCount: 0,
        nextBuddyDate: null,
        lastInteraction: null,
        buddyStatus: "CHILLING",
        hashuuid: hashedUuid,
        secretKey: encryptedKey, // Use the returned value directly
        flag : true, 

      };


      const response = await axios.post("http://localhost:8080/api/deathusers", userDetails, {
        headers: { "Content-Type": "application/json" },
      });

      // alert(`This is your most important key. Do not share it with anyone other than your beneficiary: Your Id: ${generatedUuid} Your Password: ${iv} `);
      showCredentialsBox(generatedUuid, iv);
      navigate("/death-dashboard");
    } catch (err) {
      console.error("Error submitting form:", err.response?.data || err.message);
      alert("Submission failed. Please check console logs.");
    } finally {
      setLoading(false);
    }
  };
  function showCredentialsBox(uuid, password) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.right = 0;
    overlay.style.bottom = 0;
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    // Create box
    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.borderRadius = "8px";
    box.style.padding = "32px";
    box.style.maxWidth = "600px";
    box.style.width = "98%";
    box.style.boxShadow = "0 2px 16px rgba(0,0,0,0.25)";
    box.innerHTML = `
    <h3 style="font-size:1.5em;">Your Important Credentials</h3>
    <p><strong>Your ID:</strong></p>
    <div style="display:flex; margin-bottom:16px;">
      <input type="text" value="${uuid}" readonly style="flex:1; padding:10px; font-size:1.1em;" id="uuidInput">
      <button id="copyUuid" style="margin-left:8px; font-size:1em;">Copy</button>
    </div>
    <p><strong>Your Password:</strong></p>
    <div style="display:flex; margin-bottom:16px;">
      <input type="text" value="${password}" readonly style="flex:1; padding:10px; font-size:1.1em;" id="passwordInput">
      <button id="copyPassword" style="margin-left:8px; font-size:1em;">Copy</button>
    </div>
    <p style="font-size:14px;color:#555;">Do not share this with anyone except your beneficiary.</p>
    <button id="closeBox" style="margin-top:16px;padding:12px 24px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:1em;">Close</button>
  `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Copy handlers
    box.querySelector("#copyUuid").onclick = () => {
      navigator.clipboard.writeText(uuid);
    };
    box.querySelector("#copyPassword").onclick = () => {
      navigator.clipboard.writeText(password);
    };

    // Close handler
    box.querySelector("#closeBox").onclick = () => {
      alert("This credential will not be visible again. One-time copy only, so please make sure to copy the credentials.");
      document.body.removeChild(overlay);
    };
  }



  return (
    <div style={styles.container}>
      {loadingScreen ? (
        <div style={styles.loadingContainer}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <h2>Enter Your Details</h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label>First Name:</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label>Middle Name:</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label>Last Name:</label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label>Date of Birth:</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </>
      )}
      <style>
        {`
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-top: 4px solidrgb(8, 57, 109);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
     

    </div>

  );
};

const styles = {
  container: { padding: "20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" },
  inputGroup: { marginBottom: "15px" },
  input: { width: "100%", padding: "8px", fontSize: "16px" },
  button: { padding: "10px 20px", backgroundColor: "#007bff", color: "#fff", border: "none", cursor: "pointer" },
};

export default UserDetailsForm;