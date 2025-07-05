import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import "./DecryptFile.css"; // Assuming you have a CSS file for styles
import { supabase } from "./supabaseClient"; // Adjust the import path as necessary

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
            voiceFileUrl: fileObj.voiceFileUrl,
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
  if (!aesKey) throw new Error("AES key not available");
  if (!ciphertext) throw new Error("Ciphertext not provided");

  try {
    if (fileType === "letter") {
      const cleanedCiphertext = ciphertext.trim();
      const decryptedData = CryptoJS.AES.decrypt(cleanedCiphertext, aesKey);
      if (!decryptedData || decryptedData.sigBytes <= 0) throw new Error("Decryption produced invalid data");
      const decryptedText = decryptedData.toString(CryptoJS.enc.Utf8);
      if (!decryptedText) throw new Error("Decryption failed: Invalid key or data for LetterFile");
      return decryptedText;
    }

    if (fileType === "media") {
      const cleanedCiphertext = ciphertext.trim();
      const decryptedData = CryptoJS.AES.decrypt(cleanedCiphertext, aesKey);
      if (!decryptedData || decryptedData.sigBytes <= 0) throw new Error("Decryption produced invalid data");
      const hexString = decryptedData.toString(CryptoJS.enc.Utf8);
      if (!hexString) throw new Error("Decryption failed: Invalid key or data for MediaFile");
      const wordArray = CryptoJS.enc.Hex.parse(hexString);
      const base64 = wordArray.toString(CryptoJS.enc.Base64);
      const binaryString = atob(base64);
      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }
      return byteArray.buffer;
    }

    if (fileType === "voice") {
      // Fetch the ciphertext as an ArrayBuffer
      const arrayBuffer = await ciphertext.arrayBuffer();
      const encryptedArray = new Uint8Array(arrayBuffer);

      // Ensure the data is long enough to contain IV (16 bytes)
      if (encryptedArray.length < 16) {
        throw new Error("Ciphertext is too short to contain an IV");
      }

      // Extract IV (first 16 bytes)
      const iv = CryptoJS.lib.WordArray.create(encryptedArray.slice(0, 16));

      // Extract ciphertext (remaining bytes)
      const ciphertextWords = CryptoJS.lib.WordArray.create(encryptedArray.slice(16));

      // Parse AES key as UTF-8 (consistent with encryption)
      const key = CryptoJS.enc.Utf8.parse(aesKey);

      // Decrypt using AES-CBC with PKCS7 padding
      const decryptedData = CryptoJS.AES.decrypt(
        { ciphertext: ciphertextWords },
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      if (!decryptedData || decryptedData.sigBytes <= 0) {
        throw new Error("Decryption produced invalid data for VoiceFile");
      }

      // Convert decrypted WordArray to Uint8Array
      const decryptedArray = new Uint8Array(decryptedData.sigBytes);
      for (let i = 0; i < decryptedData.sigBytes; i++) {
        decryptedArray[i] = (decryptedData.words[i >> 2] >> (24 - (i % 4) * 8)) & 0xff;
      }

      // Verify WebM header (optional, for debugging)
      if (decryptedArray.length >= 4 && decryptedArray[0] !== 0x1A || decryptedArray[1] !== 0x45 || decryptedArray[2] !== 0xDF || decryptedArray[3] !== 0xA3) {
        console.warn("Decrypted data may not be a valid WebM file");
      }

      return decryptedArray.buffer;
    }

    throw new Error("Invalid file type specified");
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
        setMessage({ text: "No encrypted files to decrypt.", isSuccess: false });
        setLoading(false);
        return;
      }
      if (!encryptedAesKey || !password) {
        throw new Error("AES key or password is missing.");
      }
      const decryptedKey = await decryptKey(uuid.trim(), encryptedAesKey, password.trim());

      if (!decryptedKey) {
        throw new Error("Invalid UUID or password. Cannot decrypt files.");
      }

      const decryptedFileList = await Promise.all(
        encryptedFileUrls.map(async (fileUrl, index) => {
          try {
            let fileType, url, fileName, bucketName;
            if (fileUrl.letterFileUrl) {
              fileType = "letter";
              url = fileUrl.letterFileUrl;
              bucketName = "letters";
              fileName = fileUrl.fileName;
            } else if (fileUrl.mediaFileUrl) {
              fileType = "media";
              url = fileUrl.mediaFileUrl;
              bucketName = "media";
              fileName = fileUrl.fileName;
            } else if (fileUrl.voiceFileUrl) {
              fileType = "voice";
              url = fileUrl.voiceFileUrl;
              bucketName = "voice";
              fileName = fileUrl.fileName;
            } else {
              // Skip if no valid URL is present
              return null;
            }
            
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from(bucketName).createSignedUrl(url, 60);
            if (signedUrlError) throw signedUrlError;

            const signedUrl = signedUrlData.signedUrl;
            
            // Fetch voice files as a 'blob', others as 'text'
            const responseType = fileType === "voice" ? "blob" : "text";
            const fileResponse = await axios.get(signedUrl, { responseType });
            
            const encryptedData = fileResponse.data; // Use .data for both blob and text

            if (!encryptedData) {
              throw new Error("Downloaded file data is empty.");
            }

            // Decrypt the file content
            const decryptedContent = await decryptFile(encryptedData, decryptedKey, fileType);
            
            // Process based on file type
            if (fileType === "voice") {
              const decryptedBlob = new Blob([decryptedContent], { type: "audio/webm" });
              return {
                type: "voice",
                url: URL.createObjectURL(decryptedBlob),
                fileName: fileName?.endsWith(".enc") ? fileName.replace(".enc", "") : `decrypted_audio_${index + 1}.webm`,
              };
            } else if (fileType === "letter") {
              return {
                type: "letter",
                content: decryptedContent,
                fileName: fileName?.endsWith(".enc") ? fileName.replace(".enc", "") : `decrypted_letter_${index + 1}.html`,
              };
            } else if (fileType === "media") {
              const mimeType = fileName?.endsWith(".mp4.enc") ? "video/mp4" : (fileName?.endsWith(".png.enc") ? "image/png" : "image/jpeg");
              const decryptedBlob = new Blob([decryptedContent], { type: mimeType });
              return {
                type: "media",
                url: URL.createObjectURL(decryptedBlob),
                fileName: fileName?.endsWith(".enc") ? fileName.replace(".enc", "") : `decrypted_media_${index + 1}.${mimeType.split("/")[1]}`,
              };
            }
          } catch (error) {
            console.error(`Error processing file ${index + 1}:`, error);
            return { error: `Error decrypting file ${index + 1}: ${error.message}` };
          }
        })
      );
      
      const validFiles = decryptedFileList.filter(file => file && !file.error);
      const errors = decryptedFileList.filter(file => file && file.error);
      
      if (errors.length > 0) {
        setError(errors.map(e => e.error).join('; '));
      }

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
   <div className="decryptfile-container">
      <h2 className="decryptfile-title">Decrypt Files</h2>
      {error && <p className="decryptfile-error">{error}</p>}
      {message.text && (
        <p className={message.isSuccess ? "decryptfile-success" : "decryptfile-error"}>
          {message.text}
        </p>
      )}
      <div className="decryptfile-form">
        <h3 className="decryptfile-note">
          Please enter the secrets of the person whose assets you are going to claim!
        </h3>
        <div className="decryptfile-inputgroup">
          <label htmlFor="uuid" className="decryptfile-label">Enter UUID:</label>
          <input
            id="uuid"
            type="text"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            placeholder="Enter UUID"
            className="decryptfile-input"
            autoComplete="off"
          />
        </div>
        <div className="decryptfile-inputgroup">
          <label htmlFor="password" className="decryptfile-label">Enter Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            className="decryptfile-input"
            autoComplete="off"
          />
        </div>
        <div className="decryptfile-btn-row">
          <button
            onClick={validateUuid}
            disabled={loading || !uuid || !password}
            className="decryptfile-btn decryptfile-btn-validate"
          >
            Validate Secrets
          </button>
          <button
            onClick={decryptFiles}
            disabled={loading || !uuid || !isUuidValid || encryptedFileUrls.length === 0}
            className="decryptfile-btn decryptfile-btn-decrypt"
          >
            {loading ? "Decrypting..." : "Decrypt Files"}
          </button>
        </div>
      </div>
      {decryptedFiles.length > 0 && (
        <div className="decryptfile-files">
          <h3 className="decryptfile-section-title">Decrypted Files</h3>
          {decryptedFiles.map((file, index) => (
            <div key={index} className="decryptfile-filecard">
              <h4 className="decryptfile-filename">{file.fileName}</h4>
              {file.type === "letter" ? (
                <div>
                  <div
                    className="decryptfile-letter"
                    dangerouslySetInnerHTML={{ __html: file.content }}
                  />
                  <a
                    href={URL.createObjectURL(new Blob([file.content], { type: "text/html" }))}
                    download={file.fileName}
                    className="decryptfile-download"
                  >
                    Download Letter
                  </a>
                </div>
              ) : file.type === "media" ? (
                <div>
                  {file.fileName?.endsWith(".mp4") ? (
                    <video
                      controls
                      src={file.url}
                      className="decryptfile-media"
                    />
                  ) : (
                    <img
                      src={file.url}
                      alt={file.fileName}
                      className="decryptfile-media"
                    />
                  )}
                  <a
                    href={file.url}
                    download={file.fileName}
                    className="decryptfile-download"
                  >
                    Download Media
                  </a>
                </div>
              ) : file.type === "voice" ? (
                <div>
                  <audio
                    controls
                    src={file.url}
                    className="decryptfile-voice"
                  />
                  <a
                    href={file.url}
                    download={file.fileName}
                    className="decryptfile-download"
                  >
                    Download Audio
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecryptFile;