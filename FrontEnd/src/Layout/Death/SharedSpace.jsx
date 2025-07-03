import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import "./SharedSpace.css";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

const SharedSpace = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [encryptedAESKeyData, setEncryptedAESKeyData] = useState(null); // Renamed for clarity
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState(""); // This is used as IV for decrypting AES key
  const [generatedPassword, setGeneratedPassword] = useState(""); // This is the readable key for token
  const [loading, setLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [token, setToken] = useState("");
  const [totalSharedSpace, setTotalSharedSpace] = useState(0);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Error fetching user:", error?.message);
        navigate("/login");
        return; // Important: Stop execution if no user
      }
      setCurrentUser(user);
    };
    fetchUser();
  }, [navigate]); // Added navigate to dependency array

  useEffect(() => {
    const fetchCount = async () => {
      try {
        // Ensure currentUser.id is available before making the request
        if (currentUser && currentUser.id) {
          const response = await axios.get(
            `http://localhost:8080/shared-file/totalSpaces/${currentUser.id}`
          );
          setTotalSharedSpace(response.data);
        }
      } catch (error) {
        console.error("Error fetching total shared space:", error);
      }
    };
    if (currentUser) {
      fetchCount();
    }
  }, [currentUser]);

  const getEncryptedKey = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/deathusers/getKey/${userId}`
      );
      if (response.status === 200 && response.data) {
        // Assuming response.data directly contains the encrypted key string
        setEncryptedAESKeyData(response.data);
        return response.data; // Return the key for immediate use
      } else {
        throw new Error("No encrypted key found.");
      }
    } catch (error) {
      console.error("Error fetching encrypted key:", error);
      throw error;
    }
  };

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
        `http://localhost:8080/api/deathusers/findHashToken/${hashedToken}`
      );
      if (response.status === 200) {
        setIsValidated(true);
        await getEncryptedKey(currentUser.id);
        setMessage("UUID validated successfully. You can now generate a token.");
      } else {
        setIsValidated(false);
        setMessage("Invalid UUID or password. Please try again.");
      }
    } catch (error) {
      console.error("Validation error:", error);
      setIsValidated(false);
      setMessage(`Validation failed: ${error.message || "Try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const generateUniqueString = () => {
    const adjectives = ["cool", "fast", "smart", "silent", "red"];
    const nouns = ["tiger", "rocket", "banana", "tree", "hat"];
    const verbs = ["jumps", "runs", "flies", "dances", "codes"];
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    return `${rand(adjectives)}-${rand(nouns)}-${rand(verbs)}`;
  };

  const hashReadableKey = (input) => {
    const hash = CryptoJS.SHA256(input);
    return hash.toString(CryptoJS.enc.Hex);
  };

  // Encryption function
  const encryptPayload = async (payload, passphrase) => {
    try {
      const iv = CryptoJS.lib.WordArray.random(16); // Generate 16-byte IV
      const key = CryptoJS.SHA256(passphrase); // Derive key from passphrase
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Concatenate IV and ciphertext into a single WordArray
      const combined = CryptoJS.lib.WordArray.create();
      combined.concat(iv);
      combined.concat(encrypted.ciphertext);

      // Return Base64-encoded combined IV + ciphertext
      return CryptoJS.enc.Base64.stringify(combined);
    } catch (error) {
      throw new Error("Encryption failed: " + error.message);
    }
  };

  // This function will now generate the token AND save the metadata
  const generateTokenAndSave = async () => {
    try {
      if (!currentUser || !encryptedAESKeyData) {
        setMessage("Please validate UUID and ensure key data is fetched.");
        return;
      }

      // Decrypt the AES key
      const decryptedAESKey = await decryptKey(
        uuid.trim(),
        encryptedAESKeyData,
        password.trim()
      );

      const payload = {
        userId: currentUser.id,
        key: decryptedAESKey,
      };

      const readableKey = generateUniqueString(); // This will be the password for the shared space
      const generatedToken = await encryptPayload(payload, readableKey);

      setToken(generatedToken);
      setGeneratedPassword(readableKey); // Set the readable password
      setCopiedToken(false); // Reset copied flag when new token is generated
      setCopiedPassword(false); // Reset copied password flag as well

      // Now, proceed with saving the metadata
      const metaData = {
        authorId: currentUser.id,
        uploadId: null, // Will be set on actual file upload
        token: generatedToken, // Use the newly generated token
        spaceHashPass: hashReadableKey(readableKey), // Use the newly generated readableKey
        uploadFileUrl: null, // Will be set on actual file upload
        fileName : null, 
        userz: {
          userIdX: currentUser.id,
        },
      };

      try {
        await axios.post(
          "http://localhost:8080/shared-file/add-file",
          metaData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error(
          "Error uploading metadata:",
          error.response?.data || error.message
        );
        setMessage(
          (prev) => prev +
          `\nFailed to add shared space metadata: ${
            error.response?.data?.message || error.message
          }`
        );
        return;
      }

      const tokenMetadata = {
        token: generatedToken, // Use the newly generated token
        userIDX: currentUser.id,
        expirydate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      try {
        await axios.post(
          "http://localhost:8080/shared-file/addToken",
          tokenMetadata,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setMessage(
          (prev) => prev + "\nToken metadata added successfully."
        );
      } catch (error) {
        console.error(
          "Error adding token metadata:",
          error.response?.data || error.message
        );
        setMessage(
          (prev) =>
            prev +
            `\nFailed to add token metadata: ${
              error.response?.data?.message || error.message
            }`
        );
      }
    } catch (err) {
      console.error("Error generating token and saving:", err);
      setMessage(`Failed to generate token and save data: ${err.message}`);
    }
  };

  const copyToken = async () => {
    try {
      if (!token) {
        setMessage("No token generated to copy.");
        return;
      }
      const encodedToken = encodeURIComponent(token);
      await navigator.clipboard.writeText(
        `http://localhost:8080/shared-file/verify?token=${encodedToken}`
      );
      setCopiedToken(true);
      setMessage("Token URL copied to clipboard!");
    } catch (err) {
      console.error("Copy failed:", err);
      setMessage("Failed to copy token.");
    }
  };

  const copyPassword = async () => {
    try {
      if (!generatedPassword) {
        setMessage("No password generated to copy.");
        return;
      }
      await navigator.clipboard.writeText(generatedPassword);
      setCopiedPassword(true);
      setMessage("Password copied to clipboard!");
    } catch (err) {
      console.error("Copying password failed:", err);
      setMessage("Failed to copy password.");
    }
  };

  return (
    <div className="shared-container">
      <h2>Secure Shared Space</h2>
      <div className="total-space" style={{ color: "Black" }}>
        Total Spaces: <strong>{totalSharedSpace ?? "..."}</strong>
      </div>
      <br />
      <div className="form-box">
        <label style={{color : "Black"}}>UUID</label>
        <input
          type="text"
          placeholder="Enter UUID"
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
          disabled={loading || isValidated} // Disable after validation
        />

        <label style={{color : "black"}}>Password</label>
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading || isValidated} // Disable after validation
        />

        <button
          className="validate-button"
          onClick={validateUuid}
          disabled={!uuid || !password || loading || isValidated}
        >
          {loading ? "Validating..." : "Validate Secrets"}
        </button>

        {message && <p className="message">{message}</p>}
      </div>

      <div className="token-section">
        {isValidated && ( // Only show "Generate Token and Save" button after validation
          <button onClick={generateTokenAndSave} disabled={!currentUser} style={{ background: "green", color: "white" }}>
            Generate Token & Save Shared Space
          </button>
        )}

        {token && ( // Only show token and copy button if token exists
          <div className="token-box">
            <p>{token}</p>
            <button onClick={copyToken}>
              {copiedToken ? "Copied!" : "Copy Token URL"}
            </button>
          </div>
        )}

        {generatedPassword && ( // Only show password and copy button if generatedPassword exists
          <div className="token-box">
            <p>{generatedPassword}</p>
            <button onClick={copyPassword}>
              {copiedPassword ? "Copied!" : "Copy Space Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedSpace;