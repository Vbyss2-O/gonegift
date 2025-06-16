import React, { useState, useEffect } from "react";
import axios from "axios";
import { AES, enc } from "crypto-js";


const DecryptFile = () => {
  const [encryptedFileUrls, setEncryptedFileUrls] = useState([]); // Multiple files
  const [encryptedAesKey, setEncryptedAesKey] = useState(null);
  const [decryptedFiles, setDecryptedFiles] = useState([]);
  const [uuid, setUuid] = useState(""); // UUID entered by beneficiary
  const [password, setPassword] = useState(""); // Password (IV for AES-256)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userID, setUserId] = useState(null);
  const [isUuidValid, setIsUuidValid] = useState(false);
  const [message, setMessage] = useState({ text: "", isSuccess: false });

  const hashWithSalt = async (x) => {
    const salt = x.substring(0, 16); // Use first 16 characters of UUID as salt
    const text = x + salt;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const validateUuid = async () => {
   

    try {
      const hashedToken = await hashWithSalt(
        uuid.trim() + "Vedant_Kasar" + password.trim()
      );
      const response = await axios.get(
        `http://localhost:8080/api/deathusers/findHashToken/${hashedToken}`
      );

      if (response.status === 200) {
        setIsUuidValid(true);
        setMessage({
          text: "Validated successfully.",
          isSuccess: true,
        });

        // Fetch userID
        try {
          const userIdResponse = await axios.get(
            `http://localhost:8080/api/deathusers/getidfromHashToken/${hashedToken}`
          );

          if (userIdResponse.status === 200) {
            setUserId(userIdResponse.data);
          } else {
            throw new Error("No user ID found.");
          }
        } catch (error) {
          console.error("Error fetching user ID:", error);
          setError("Failed to fetch user ID.");
        }
      } else {
        setIsUuidValid(false);
        setMessage({
          text: "Invalid UUID and Password. Please enter correct Secrets.",
          isSuccess: false,
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      setIsUuidValid(false);
      setMessage({
        text: "Validation failed. Please try again.",
        isSuccess: false,
      });
    }
  };

  // Fetch encrypted key
  useEffect(() => {
    const fetchEncryptedKey = async () => {
      try {
        if (!userID) return;

        const response = await axios.get(
          `http://localhost:8080/api/deathusers/getKey/${userID}`
        );

        if (response.status === 200) {
          setEncryptedAesKey(response.data);
        } else {
          throw new Error("No AES key found.");
        }
      } catch (error) {
        console.error("Error fetching AES key:", error);
        setError("Failed to fetch AES key.");
      }
    };

    fetchEncryptedKey();
  }, [userID]);

  // Fetch all encrypted files
  useEffect(() => {
    const fetchEncryptedFiles = async () => {
      try {
        if (!userID) return;

        const response = await axios.get(
          `http://localhost:8080/api/deathusers/listOfFiles/${userID}`
        );

        if (response.status === 200) {
          const files = response.data.map((fileObj) => ({
            letterFileUrl: fileObj.letterFileUrl,
            mediaFileUrl: fileObj.mediaFileUrl,
          }));

          setEncryptedFileUrls(files);
        } else {
          throw new Error("No encrypted files found.");
        }
      } catch (error) {
        console.error("Error fetching encrypted files:", error);
        setError("Failed to fetch encrypted files.");
      }
    };

    fetchEncryptedFiles();
  }, [userID]);

  // Decrypt the key using the UUID
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

  // Decrypt all files using AES key
  const decryptFiles = async () => {
    setLoading(true);
    setError(null);
    setDecryptedFiles([]);

    try {
      if (encryptedFileUrls.length === 0) {
        throw new Error("No encrypted files available.");
      }

      const decryptedKey = await decryptKey(uuid, encryptedAesKey, password);
      if (!decryptedKey) {
        throw new Error("Invalid UUID. Cannot decrypt files.");
      }

      const decryptedFileList = await Promise.all(
        encryptedFileUrls.map(async (fileUrl, index) => {
          try {
            const fileResponse = await axios.get(
              fileUrl.letterFileUrl || fileUrl.mediaFileUrl,
              {
                responseType: "blob",
              }
            );

            const encryptedBlob = await fileResponse.data;
            const reader = new FileReader();

            return new Promise((resolve, reject) => {
              reader.onload = () => {
                try {
                  const encryptedContent = enc.Base64.parse(reader.result);
                  const decryptedData = AES.decrypt(
                    encryptedContent.toString(enc.Utf8),
                    decryptedKey
                  ).toString(enc.Utf8);

                  if (!decryptedData) {
                    reject("Decryption failed. Invalid key.");
                  }

                  const decryptedBlob = new Blob([decryptedData], {
                    type: "application/octet-stream",
                  });

                  resolve(URL.createObjectURL(decryptedBlob));
                } catch (error) {
                  reject(
                    "Failed to decrypt file. Invalid key or corrupted data."
                  );
                }
              };

              reader.readAsText(encryptedBlob);
            });
          } catch (error) {
            return `Error decrypting file ${index + 1}.`;
          }
        })
      );

      setDecryptedFiles(decryptedFileList);
    } catch (error) {
      setError("Error decrypting files: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="decrypt-file">
      <h2>Decrypt Files</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message.text && (
        <p style={{ color: message.isSuccess ? "green" : "red" }}>
          {message.text}
        </p>
      )}
      <h3>
        Note: Please Enter the secrets of the person whose Assets you are going to
        Claim!
      </h3>
      <label>Enter UUID:</label>
      <input
        type="text"
        value={uuid}
        onChange={(e) => setUuid(e.target.value)}
        placeholder="Enter UUID"
        style={{ margin: "10px 0", padding: "5px" }}
      />

      <label>Enter Password:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter Password"
        style={{ margin: "10px 0", padding: "5px" }}
      />
      <button
        onClick={validateUuid}
        disabled={loading || !uuid || !password}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading ? "#6c757d" : "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading || !uuid || !password ? "not-allowed" : "pointer",
        }}
      >
        Validate Secrets
      </button>

      <button
        onClick={decryptFiles}
        disabled={loading || !uuid || !isUuidValid}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading ? "#6c757d" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading || !uuid || !isUuidValid ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Decrypting..." : "Decrypt Files"}
      </button>

      {decryptedFiles.length > 0 && (
        <div>
          <h3>Decrypted Files:</h3>
          <ul>
            {decryptedFiles.map((file, index) => (
              <li key={index}>
                <a href={file} download={`decrypted_file_${index + 1}`}>
                  Download File {index + 1}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DecryptFile;