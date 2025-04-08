import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {enc, AES, PBKDF2 } from "crypto-js";
import CryptoJS from "crypto-js";


const UserDetailsForm = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastname, setLastname] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(true);  // Added for initial loading state
  const [userEmail, setUserEmail] = useState("");

  // Check if user is logged in, if not redirect to login
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          console.error("User not found or error:", error?.message || "No user found");
          navigate("/login");
        } else {
          setUserEmail(data.user.email);
        }
      } catch (err) {
        console.error("Error in checkUser:", err.message);
        navigate("/login");
      }
    };
    checkUser();
  }, [navigate]);

  // Check if user exists in database, if yes redirect to death-dashboard
  useEffect(() => {
    const checkUserInDatabase = async () => {
      if (!userEmail) return;

      try {
        const { data: existingUser, error } = await supabase
          .from("death_user")
          .select("email, first_name, lastname")
          .eq("email", userEmail)
          .maybeSingle();

        if (error) {
          console.error("Error checking user:", error.message);
          return;
        }

        if (existingUser && existingUser.first_name && existingUser.lastname) { 
          console.log("User already exists and has completed profile, redirecting...");
          navigate("/death-dashboard");
        }
      } catch (err) {
        console.error("Error in checkUserInDatabase:", err.message);
      } finally {
        setLoadingScreen(false);  // Stop loading once checks are done
      }
    };

    checkUserInDatabase();
  }, [userEmail, navigate]);

  // Hashing function using crypto.subtle API
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

  const generateKeys = async (uuid) => {
    try {
      // 1. Generate salt
      const salt = CryptoJS.SHA256(uuid).toString();
      console.log('Salt:', salt);
  
      // 2. Derive key - keep as WordArray
      const derivedKey = CryptoJS.PBKDF2(uuid, salt, {
        keySize: 256/32,
        iterations: 10000,
      }); // Remove .toString()
  
      console.log('Derived Key (Hex):', derivedKey.toString(CryptoJS.enc.Hex));
  
      // // 3. Encrypt with proper key handling
      // const encrypted = CryptoJS.AES.encrypt(
      //   derivedKey.toString(), // Data to encrypt (as string)
      //   derivedKey, // Key as WordArray (correct)
      //   { 
      //     keySize: 256/32, // Explicitly set
      //     mode: CryptoJS.mode.CBC,
      //     padding: CryptoJS.pad.Pkcs7,
      //     iv: CryptoJS.enc.Hex.parse('00000000000000000000000000000000')
      //   }
      // );
  
      // const encryptedKey = encrypted.toString();
      // console.log('Encrypted Key:', encryptedKey);
      // return encryptedKey ;
      return derivedKey.toString(CryptoJS.enc.Hex); // Return the derived key as hex string
      
    } catch (error) {
      console.error('Key generation failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        console.error("Error fetching user:", error?.message || "No user found");
        navigate("/login");
        return;
      }

      const userIdX = data.user.id;
      const email = data.user.email;

      const generatedUuid = uuidv4();
      const hashedUuid = await hashWithSalt(generatedUuid);
      
      // Get the encrypted key directly from the function
      const encryptedKey = await generateKeys(generatedUuid);

      const userDetails = {
        userIdX,
        email,
        firstName,
        lastname,
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
      };

      console.log("Submitting user details:", userDetails);

      const response = await axios.post("http://localhost:8080/api/deathusers", userDetails, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("User created successfully:", response.data);
      alert(`This is your most important key. Do not share it with anyone other than your beneficiary: ${generatedUuid}`);
      navigate("/death-dashboard");
    } catch (err) {
      console.error("Error submitting form:", err.response?.data || err.message);
      alert("Submission failed. Please check console logs.");
    } finally {
      setLoading(false);
    }
  };

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
                onChange={(e) => setFirstName(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label>Last Name:</label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
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