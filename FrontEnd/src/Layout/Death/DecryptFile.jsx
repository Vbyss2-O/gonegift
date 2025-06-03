import React, { useState, useEffect } from "react";
import axios from "axios";
import { AES, enc } from "crypto-js";

const DecryptFile = ({ magicToken }) => {
  const [encryptedFileUrls, setEncryptedFileUrls] = useState([]); // Multiple files
  const [encryptedAesKey, setEncryptedAesKey] = useState(null);
  const [decryptedFiles, setDecryptedFiles] = useState([]);
  const [uuid, setUuid] = useState(""); // UUID entered by beneficiary
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userID, setUserId] = useState(null);
  //this this password mince the IV of the AES256
  const [password , setPassword] = useState(null);

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

  // fetch userUID from the magic token
  useEffect(() => {
    const fetchUserUID = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/magic-link/retrieve?token=${magicToken}`
        );

        if (response.status === 200) {
          setUserId(response.data); // Store userUID
        } else {
          throw new Error("Invalid magic token.");
        }
      } catch (error) {
        console.error("Error fetching user UID:", error);
        setError("Failed to fetch user UID.");
      }
    };

    fetchUserUID();
  }, [magicToken]);

  // fetch key
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

  //fetch all encrypted files using userUID (API 2)
  useEffect(() => {
    const fetchEncryptedFiles = async () => {
      try {
        if (!userID) return;

        const response = await axios.get(
          `http://localhost:8080/api/deathusers/listOfFiles/${userID}`
        );

        if (response.status === 200) {
          // Extract letterFileUrl and mediaFileUrl from each object
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

  // decrypt the key using the uuid 
 const decryptKey = (uuid, encryptedKey, ivBase64) => {
  try {
    // 1. Recreate the salt and derived key
    const salt = CryptoJS.SHA256(uuid).toString();

    const derivedKey = CryptoJS.PBKDF2(uuid, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    // 2. Convert Base64 IV back to WordArray
    const iv = CryptoJS.enc.Base64.parse(ivBase64);

    // 3. Decrypt the encrypted key
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, derivedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // 4. Convert to UTF-8 string
    return decrypted.toString(CryptoJS.enc.Utf8);

  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
};


  // decrypt all files using AES key
  const decryptFiles = async () => {
    setLoading(true);
    setError(null);
    setDecryptedFiles([]);

    try {
      if (encryptedFileUrls.length === 0) {
        throw new Error("No encrypted files available.");
      }

      const decryptedKey = decryptKey(uuid ,encryptedAesKey , password);
      if (!decryptedKey) {
        throw new Error("Invalid UUID. Cannot decrypt files.");
      }

      const decryptedFileList = await Promise.all(
        encryptedFileUrls.map(async (fileUrl) => {
          try {
            // Fetch encrypted file
            const fileResponse = await axios.get(fileUrl, {
              responseType: "blob",
            });

            const encryptedBlob = await fileResponse.data;
            const reader = new FileReader();

            return new Promise((resolve, reject) => {
              reader.onload = () => {
                try {
                  const encryptedContent = enc.Base64.parse(reader.result);

                  // Decrypt file data using the decrypted AES key
                  const decryptedData = AES.decrypt(
                    encryptedContent.toString(enc.Utf8),
                    decryptedKey
                  ).toString(enc.Utf8);

                  if (!decryptedData) {
                    reject("Decryption failed. Invalid key.");
                  }

                  // Convert decrypted data to a Blob
                  const decryptedBlob = new Blob([decryptedData], {
                    type: "application/octet-stream",
                  });

                  resolve(URL.createObjectURL(decryptedBlob));
                } catch (error) {
                  reject("Failed to decrypt file. Invalid key or corrupted data.");
                }
              };

              reader.readAsText(encryptedBlob);
            });
          } catch (error) {
            return "Error decrypting file.";
          }
        })
      );

      setDecryptedFiles(decryptedFileList);
    } catch (error) {
      setError("Error decrypting files.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="decrypt-file">
      <h2>Decrypt Files</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <h3>Note : Please Enter the secrects of person who's Assets you are going to Clam !</h3>
      <label>Enter UUID:</label>
      <input
        type="text"
        value={uuid}
        onChange={(e) => setUuid(e.target.value)}
        placeholder="Enter UUID"
        style={{ margin: "10px 0", padding: "5px" }}
      />

      <label>Enter Password:</label>
      <input type="text" 
         value = {password}
         onChange={(e) => setPassword(e.target.value)}
         placeholder="Enter Password"
        style={{ margin: "10px 0", padding: "5px" }}

      />

      <button
        onClick={decryptFiles}
        disabled={loading || !uuid}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading ? "#6c757d" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
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
