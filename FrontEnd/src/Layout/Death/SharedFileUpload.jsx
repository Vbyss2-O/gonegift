import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useNavigate, useParams } from "react-router-dom"; // Corrected import for useParams
import DragNdrop from "../components/DragNDrop"; // Assuming this path is correct
import { supabase } from "./supabaseClient"; // Assuming this path is correct
import "./SharedFileUpload.css"; // Import the custom CSS file

const SharedFileUpload = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [file, setFile] = useState(null);
  const [authorId, setAuthorId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();
  const { token } = useParams();
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          console.error("Error fetching user:", error?.message);
          navigate("/login");
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        console.error("Error in fetchUser:", error.message);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

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

  const hashReadableKey = (input) => {
    const hash = CryptoJS.SHA256(input);
    return hash.toString(CryptoJS.enc.Hex);
  };

  const validation = async () => {
    if (!input || !token) {
      setMessage("Please provide password and token.");
      return;
    }
    setLoading(true);
    setMessage("Validating password...");
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/shared-file/password/verify?token=${encodeURIComponent(token)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const hashedInput = hashReadableKey(input.trim());

      if (hashedInput === response.data) {
        setValidated(true);
        setMessage("Password validated successfully!");
      } else {
        setMessage("Invalid password. Please try again.");
      }
    } catch (error) {
      setMessage(
        "Failed to validate password: " +
          (error.response?.data?.message || error.message)
      );
      console.error("Validation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const decryptPayload = (encryptedBase64, passphrase) => {
    try {
      const combined = CryptoJS.enc.Base64.parse(encryptedBase64);
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16);
      const ciphertext = CryptoJS.lib.WordArray.create(
        combined.words.slice(4),
        combined.sigBytes - 16
      );

      const key = CryptoJS.SHA256(passphrase); // Derive key from passphrase

      const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedString) {
        throw new Error(
          "Invalid password or corrupted token. Decrypted string is empty."
        );
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error("Decryption of token payload failed:", error);
      throw new Error("Decryption of token payload failed: " + error.message);
    }
  };

  const decryptFile = async (fileData, fileType, aesKey) => {
    try {
      if (!aesKey) {
        throw new Error("AES key not available for decryption.");
      }
      if (!fileData || fileData.byteLength === 0) {
        throw new Error("File data not provided or is empty.");
      }

      const keyWordArray = CryptoJS.enc.Utf8.parse(aesKey);

      // Convert Uint8Array to WordArray for CryptoJS
      const fileWordArray = CryptoJS.lib.WordArray.create(fileData.buffer); // Use .buffer for ArrayBuffer

      if (fileWordArray.sigBytes < 16) {
        throw new Error("Encrypted file data is too short to contain IV.");
      }

      // For all file types, we assume the IV is prepended to the ciphertext
      const iv = CryptoJS.lib.WordArray.create(
        fileWordArray.words.slice(0, 4),
        16
      );
      const ciphertext = CryptoJS.lib.WordArray.create(
        fileWordArray.words.slice(4),
        fileWordArray.sigBytes - 16
      );

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext },
        keyWordArray,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      if (!decrypted || decrypted.sigBytes <= 0) {
        throw new Error("Decryption produced invalid data or empty result.");
      }

      // Convert decrypted WordArray to Uint8Array
      const decryptedArrayBuffer = new ArrayBuffer(decrypted.sigBytes);
      const decryptedUint8Array = new Uint8Array(decryptedArrayBuffer);

      for (let i = 0; i < decrypted.sigBytes; i++) {
        decryptedUint8Array[i] =
          (decrypted.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      }

      // For text files, convert to UTF-8 string
      if (fileType.startsWith("text")) {
        return new TextDecoder().decode(decryptedUint8Array);
      } else {
        // For binary files, return ArrayBuffer
        return decryptedArrayBuffer;
      }
    } catch (error) {
      console.error(`Decryption failed for ${fileType}:`, error);
      throw new Error(`Failed to decrypt ${fileType} file: ${error.message}`);
    }
  };

  const showAllFileStoredOfSharedSpace = async () => {
    if (!validated) {
      setMessage("Please validate password first.");
      return;
    }

    setLoading(true);
    setMessage("Fetching and decrypting files...");
    setFileList([]); // Clear previous list
    try {
      const decodedToken = decodeURIComponent(token);
      const decryptedPayload = decryptPayload(decodedToken, input.trim());
      const aesKey = decryptedPayload.key;
      const userId = decryptedPayload.userId;
      setAuthorId(userId);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/shared-file/getList`,
        {
          params: {
            authorId: userId,
            hash: hashReadableKey(input.trim()),
          },
        }
      );

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid response format from backend.");
      }

      if (response.data.length === 0) {
        setMessage("No files found in this shared space.");
        return;
      }

      const getFileTypeFromExtension = (fileName) => {
        const extension = fileName.split(".").pop().toLowerCase();
        switch (extension) {
          case "txt":
            return "text/plain";
          case "jpg":
          case "jpeg":
            return "image/jpeg";
          case "png":
            return "image/png";
          case "gif":
            return "image/gif";
          case "bmp":
            return "image/bmp";
          case "webp":
            return "image/webp";
          case "mp4":
            return "video/mp4";
          case "webm":
            return "video/webm"; // Covers both audio/video .webm
          case "ogg":
            return "audio/ogg";
          case "mp3":
            return "audio/mpeg";
          case "wav":
            return "audio/wav";
          case "pdf":
            return "application/pdf";
          case "doc":
            return "application/msword";
          case "docx":
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          case "xls":
            return "application/vnd.ms-excel";
          case "xlsx":
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          case "ppt":
            return "application/vnd.ms-powerpoint";
          case "pptx":
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
          case "zip":
            return "application/zip";
          case "rar":
            return "application/x-rar-compressed";
          case "7z":
            return "application/x-7z-compressed";
          default:
            return "application/octet-stream";
        }
      };

      const decryptedFiles = await Promise.all(
        response.data.map(async (fileMetadata) => {
          try {
            let filePath = fileMetadata.uploadFileUrl;

            // Ensure filePath is just the path within the bucket, without leading '/'
            if (filePath.startsWith("/")) {
              filePath = filePath.substring(1);
            }

            const fileNameWithEnc = filePath.split("/").pop();
            const originalFileName = fileNameWithEnc.replace(/\.enc$/, "");
            const fileType = getFileTypeFromExtension(originalFileName);

            const { data: fileBlob, error: downloadError } =
              await supabase.storage.from("sharedfile").download(filePath); // Use the original filePath here

            if (downloadError) {
              console.error(
                `Failed to download file ${filePath}:`,
                downloadError
              );
              throw new Error(
                `Failed to download file ${originalFileName}: ${downloadError.message}`
              );
            }

            const arrayBuffer = await fileBlob.arrayBuffer();
            const fileData = new Uint8Array(arrayBuffer);

            const decryptedData = await decryptFile(fileData, fileType, aesKey);

            const blob = new Blob([decryptedData], { type: fileType });
            const url = URL.createObjectURL(blob); // This URL will be for the decrypted blob

            return {
              fileName: originalFileName,
              fileType,
              downloadUrl: url, // This is the URL to the decrypted file blob
              metadata: fileMetadata,
            };
          } catch (fileError) {
            console.error(
              `Error processing file ${fileMetadata.uploadFileUrl}:`,
              fileError
            );
            return null;
          }
        })
      );

      const successfulFiles = decryptedFiles.filter((file) => file !== null);
      setFileList(successfulFiles);

      if (successfulFiles.length === 0) {
        setMessage(
          "No files could be decrypted successfully or found in this shared space."
        );
      } else if (successfulFiles.length < response.data.length) {
        setMessage(
          `Successfully retrieved ${successfulFiles.length} out of ${response.data.length} files. Some files failed to decrypt.`
        );
      } else {
        setMessage(
          `Successfully retrieved all ${successfulFiles.length} files.`
        );
      }
    } catch (error) {
      setMessage(`Failed to retrieve files: ${error.message}`);
      console.error("Error in showAllFileStoredOfSharedSpace:", error);
    } finally {
      setLoading(false);
    }
  };

  const encryptFile = async (fileType, fileBlobOrText) => {
    try {
      const decodedToken = decodeURIComponent(token);
      const decryptedPayload = decryptPayload(decodedToken, input.trim());
      const key = decryptedPayload.key;
      setAuthorId(decryptedPayload.userId); // Ensure authorId is set here for consistency

      if (!key) throw new Error("Encryption key not found in token payload.");

      const keyWordArray = CryptoJS.enc.Utf8.parse(key);
      const iv = CryptoJS.lib.WordArray.random(16); // Generate a new IV for each encryption

      let dataToEncrypt;
      if (fileType.startsWith("text")) {
        dataToEncrypt = fileBlobOrText; // fileBlobOrText is already text for text files
      } else {
        // For binary files (images, audio, video, pdf etc.), convert Blob to ArrayBuffer, then to WordArray
        const arrayBuffer = await fileBlobOrText.arrayBuffer();
        dataToEncrypt = CryptoJS.lib.WordArray.create(arrayBuffer);
      }

      const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, keyWordArray, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Combine IV and ciphertext into a single WordArray for storage
      const combined = CryptoJS.lib.WordArray.create()
        .concat(iv)
        .concat(encrypted.ciphertext);

      // Convert combined WordArray to Uint8Array for Blob creation
      const encryptedArray = new Uint8Array(combined.sigBytes);
      for (let i = 0; i < combined.sigBytes; i++) {
        encryptedArray[i] =
          (combined.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      }

      return new Blob([encryptedArray], { type: "application/octet-stream" }); // Return as a generic binary blob
    } catch (error) {
      console.error("File encryption failed in encryptFile:", error);
      throw new Error(`File encryption failed: ${error.message}`);
    }
  };

  const encryptFileController = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    if (!currentUser) {
      setMessage("User not logged in.");
      return;
    }

    if (!validated) {
      setMessage("Please validate password first.");
      return;
    }

    setLoading(true);
    setMessage("Encrypting and uploading file...");
    try {
      let fileContentForEncryption = file;
      if (file.type.startsWith("text")) {
        fileContentForEncryption = await file.text();
      }

      const encryptedFileBlob = await encryptFile(
        file.type,
        fileContentForEncryption
      );

      // Ensure authorId is obtained from the token payload as it's the owner of the space
      const decodedToken = decodeURIComponent(token);
      const decryptedPayload = decryptPayload(decodedToken, input.trim());
      const currentAuthorId = decryptedPayload.userId;

      const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove original extension
      const safeName = originalName.replace(/[^\w\-]+/g, "_");
      const extensionMatch = file.name.match(/\.[^/.]+$/);
      const originalExtension = extensionMatch ? extensionMatch[0] : "";

      const uniqueFileName = `${safeName}_${Date.now()}${originalExtension}.enc`;
      const fileNameX = `${safeName}_${Date.now()}${originalExtension}`; // Use the original file name with timestamp for uniqueness
      const filePath = `${currentAuthorId}/${uniqueFileName}`; // Use unique file name for storage

      const { data, error } = await supabase.storage
        .from("sharedfile")
        .upload(filePath, encryptedFileBlob, {
          cacheControl: 3600,
          upsert: false,
          contentType: "application/octet-stream", // Store as generic binary for encrypted files
        });

      if (error) {
        throw new Error("File upload failed to Supabase: " + error.message);
      }

      const fileMetadata = {
        authorId: currentAuthorId, // The actual owner of the shared space
        uploaderId: currentUser.id, // The user performing the upload
        token: token,
        spaceHashPass: hashReadableKey(input.trim()),
        uploadFileUrl: filePath,
        fileName: fileNameX, // Use the unique file name
        userz: {
          userIdX: currentAuthorId, // Redundant but kept for existing backend structure
        },
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/shared-file/add-file`,
        fileMetadata,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setMessage("Upload successful! File metadata saved.");
      setFile(null); // Clear selected file after successful upload
      // Refresh the file list after successful upload
      await showAllFileStoredOfSharedSpace();
    } catch (error) {
      setMessage("Upload failed: " + error.message);
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setFile(selectedFile);
    setMessage(""); // Clear any previous messages when a new file is selected
  };

  return (
    <div className="shared-file-upload-container">
      <h2 className="title">Shared File Space</h2>

      <div className="form-section">
        <p className="description">
          Enter the shared space password to validate and access files.
        </p>
        <div className="input-group">
          <label htmlFor="password-input" className="input-label">
            Shared Space Password:
          </label>
          <input
            id="password-input"
            type="password"
            placeholder="Enter Password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="text-input"
            disabled={loading || validated}
          />
        </div>
        <button
          onClick={validation}
          disabled={loading || validated || !input}
          className="action-button primary-button"
        >
          {loading ? "Validating..." : "Validate Password"}
        </button>
      </div>

      {validated && (
        <>
          <div className="upload-section">
            <h3 className="section-title">Upload New File</h3>
            <DragNdrop
              onFilesSelected={handleFileSelection}
              width="100%" // Adjust width for better responsiveness
              height="180px"
              className="drag-n-drop-area" // Custom class for styling
            />

            {file && (
              <p className="file-info">
                Selected file: <strong>{file.name}</strong> (
                {(file.size / 1024).toFixed(2)} KB)
              </p>
            )}

            <button
              onClick={encryptFileController}
              disabled={!file || loading}
              className="action-button upload-button"
              style={{ color: "White" }}
            >
              {loading ? "Uploading..." : "Upload & Encrypt File"}
            </button>
          </div>

          <div className="view-files-section">
            <h3 className="section-title">View Existing Files</h3>
            <button
              onClick={showAllFileStoredOfSharedSpace}
              disabled={loading} // Only disable if loading for files
              className="action-button secondary-button"
              style={{ color: "White" }}
            >
              {loading ? "Loading Files..." : "Refresh File List"}
            </button>

            {fileList.length > 0 && (
              <div className="file-list-container">
                <h4 className="list-title">Decrypted Files:</h4>
                <ul className="file-list">
                  {fileList.map((fileItem, index) => (
                    <li key={index} className="file-list-item">
                      <a
                        href={fileItem.downloadUrl}
                        download={fileItem.fileName}
                        className="file-download-link"
                        target="_blank" // Open in new tab
                        rel="noopener noreferrer" // Security best practice
                      >
                        {fileItem.fileName}
                      </a>
                      <span className="file-type-tag">
                        ({fileItem.fileType})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {message && (
        <p
          className={`message-box ${
            message.includes("failed") ||
            message.includes("Failed") ||
            message.includes("Error")
              ? "message-error"
              : "message-success"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default SharedFileUpload;
