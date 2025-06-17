
import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";

const DecryptFile = () => {
  const [encryptedFileUrls, setEncryptedFileUrls] = useState([]);
  const [encryptedAesKey, setEncryptedAesKey] = useState(null);
  const [decryptedFiles, setDecryptedFiles] = useState([]);
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userID, setUserId] = useState(null);
  const [isUuidValid, setIsUuidValid] = useState(false);
  const [message, setMessage] = useState({ text: "", isSuccess: false });

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
        setMessage({ text: "Validated successfully.", isSuccess: true });
        try {
          const userIdResponse = await axios.get(
            `http://localhost:8080/api/deathusers/findUUIDByHashuuid/${hashedToken}`
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
      setMessage({ text: "Validation failed. Please try again.", isSuccess: false });
    }
  };

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
            fileName: fileObj.fileName,
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
        { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      );
      const decryptedKey = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedKey) {
        throw new Error("Decryption resulted in empty key");
      }
      return decryptedKey;
    } catch (error) {
      console.error("Key decryption failed:", error);
      throw error;
    }
  };

  const decryptFile = async (ciphertext, aesKey, fileType) => {
    if (!aesKey) {
      throw new Error("AES key not available");
    }
    if (!ciphertext) {
      throw new Error("Ciphertext not provided");
    }
    try {
      // Ensure ciphertext is clean Base64
      const cleanedCiphertext = ciphertext.trim();
      // Decrypt the Base64-encoded ciphertext
      const decryptedData = CryptoJS.AES.decrypt(cleanedCiphertext, aesKey);
      // Check if decryption produced valid data
      if (!decryptedData || decryptedData.sigBytes <= 0) {
        throw new Error("Decryption produced invalid data");
      }
      
      if (fileType === "letter") {
        // For LetterFile, decode as UTF-8 to get HTML string
        const decryptedText = decryptedData.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) {
          throw new Error("Decryption failed: Invalid key or data for LetterFile");
        }
        return decryptedText;
      } else if (fileType === "media") {
        // For MediaFile, decode as UTF-8 to get hex string
        const hexString = decryptedData.toString(CryptoJS.enc.Utf8);
        if (!hexString) {
          throw new Error("Decryption failed: Invalid key or data for MediaFile");
        }
        // Parse hex string to WordArray
        const wordArray = CryptoJS.enc.Hex.parse(hexString);
        // Convert WordArray to Base64
        const base64 = wordArray.toString(CryptoJS.enc.Base64);
        // Decode Base64 to binary
        const binaryString = atob(base64);
        const byteArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          byteArray[i] = binaryString.charCodeAt(i);
        }
        return byteArray.buffer; // Return ArrayBuffer
      } else {
        throw new Error("Invalid file type specified");
      }
    } catch (error) {
      console.error(`Decryption failed for ${fileType}:`, error);
      throw new Error(`Failed to decrypt ${fileType} file: ${error.message}`);
    }
  };

  const decryptFiles = async () => {
    setLoading(true);
    setError(null);
    setDecryptedFiles([]);

    try {
      if (encryptedFileUrls.length === 0) {
        setMessage({ text: "No encrypted files available to decrypt.", isSuccess: false });
        return;
      }
      if (!encryptedAesKey || !password) {
        throw new Error("AES key or password is missing.");
      }
      const decryptedKey = await decryptKey(uuid, encryptedAesKey, password);
      if (!decryptedKey) {
        throw new Error("Invalid UUID or password. Cannot decrypt files.");
      }
      console.log("Decrypted AES key:", decryptedKey); // Debug key

      const decryptedFileList = await Promise.all(
        encryptedFileUrls.map(async (fileUrl, index) => {
          try {
            const isLetterFile = !!fileUrl.letterFileUrl;
            const url = fileUrl.letterFileUrl || fileUrl.mediaFileUrl;
            const fileResponse = await axios.get(url, { responseType: "blob" });
            const encryptedBlob = fileResponse.data;
            const reader = new FileReader();

            return new Promise((resolve, reject) => {
              reader.onload = async () => {
                try {
                  // Read as text to avoid Base64 encoding issues
                  const ciphertext = reader.result;
                  console.log(`Ciphertext for file ${index + 1}:`, ciphertext.substring(0, 100)); // Debug ciphertext
                  if (!ciphertext) {
                    throw new Error("Invalid ciphertext received.");
                  }
                  const decryptedContent = await decryptFile(
                    ciphertext,
                    decryptedKey,
                    isLetterFile ? "letter" : "media"
                  );

                  if (isLetterFile) {
                    resolve({
                      type: "letter",
                      content: decryptedContent,
                      fileName: fileUrl.fileName?.endsWith(".enc")
                        ? fileUrl.fileName.replace(".enc", "")
                        : `decrypted_letter_${index + 1}.html`,
                    });
                  } else {
                    const mimeType = fileUrl.fileName?.endsWith(".mp4.enc")
                      ? "video/mp4"
                      : fileUrl.fileName?.endsWith(".png.enc")
                      ? "image/png"
                      : "image/jpeg";
                    const decryptedBlob = new Blob([decryptedContent], { type: mimeType });
                    resolve({
                      type: "media",
                      url: URL.createObjectURL(decryptedBlob),
                      fileName: fileUrl.fileName?.endsWith(".enc")
                        ? fileUrl.fileName.replace(".enc", "")
                        : `decrypted_media_${index + 1}.${mimeType.split("/")[1]}`,
                    });
                  }
                } catch (error) {
                  console.error(`Error decrypting file ${index + 1}:`, error);
                  reject(`Failed to decrypt file ${index + 1}: ${error.message}`);
                }
              };
              reader.onerror = () => reject(`Failed to read file ${index + 1}.`);
              reader.readAsText(encryptedBlob); // Read as text instead of DataURL
            });
          } catch (error) {
            console.error(`Error processing file ${index + 1}:`, error);
            return `Error decrypting file ${index + 1}: ${error.message}`;
          }
        })
      );

      const validFiles = decryptedFileList.filter(
        (file) => typeof file === "object" && (file.type === "letter" || file.type === "media")
      );
      if (validFiles.length === 0 && decryptedFileList.length > 0) {
        throw new Error("No files could be decrypted successfully.");
      }
      setDecryptedFiles(validFiles);
    } catch (error) {
      setError(`Error decrypting files: ${error.message || "An unexpected error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="decrypt-file" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Decrypt Files</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message.text && (
        <p style={{ color: message.isSuccess ? "green" : "red" }}>{message.text}</p>
      )}
      <h3>Note: Please Enter the secrets of the person whose Assets you are going to Claim!</h3>
      <label>Enter UUID:</label>
      <input
        type="text"
        value={uuid}
        onChange={(e) => setUuid(e.target.value)}
        placeholder="Enter UUID"
        style={{ margin: "10px 0", padding: "5px", width: "100%" }}
      />
      <label>Enter Password:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter Password"
        style={{ margin: "10px 0", padding: "5px", width: "100%" }}
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
        disabled={loading || !uuid || !isUuidValid || encryptedFileUrls.length === 0}
        style={{
          marginTop: "10px",
          marginLeft: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor:
            loading || !uuid || !isUuidValid || encryptedFileUrls.length === 0
              ? "#6c757d"
              : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor:
            loading || !uuid || !isUuidValid || encryptedFileUrls.length === 0
              ? "not-allowed"
              : "pointer",
        }}
      >
        {loading ? "Decrypting..." : "Decrypt Files"}
      </button>
      {decryptedFiles.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Decrypted Files:</h3>
          {decryptedFiles.map((file, index) => (
            <div key={index} style={{ marginBottom: "20px" }}>
              {file.type === "letter" ? (
                <div>
                  <h4>{file.fileName}</h4>
                  <div
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      borderRadius: "4px",
                      background: "#f9f9f9",
                    }}
                    dangerouslySetInnerHTML={{ __html: file.content }}
                  />
                  <a
                    href={URL.createObjectURL(new Blob([file.content], { type: "text/html" }))}
                    download={file.fileName}
                    style={{ marginTop: "10px", display: "inline-block" }}
                  >
                    Download Letter
                  </a>
                </div>
              ) : (
                <div>
                  <h4>{file.fileName}</h4>
                  {file.fileName?.endsWith(".mp4") ? (
                    <video
                      controls
                      src={file.url}
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  ) : (
                    <img
                      src={file.url}
                      alt={file.fileName}
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  )}
                  <a
                    href={file.url}
                    download={file.fileName}
                    style={{ marginTop: "10px", display: "inline-block" }}
                  >
                    Download Media
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecryptFile;