import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";
import axios from "axios";
import CryptoJS from "crypto-js";
import { FiMic, FiSquare, FiX, FiPlay, FiPause, FiUpload } from "react-icons/fi";
import "./AudioRecorder.css";
import BackButton from "../components/BackButton"; // Import the BackButton component

const UploadPage = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");
  const [isUuidValid, setIsUuidValid] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [encryptedAesKey, setEncryptedAesKey] = useState(null);
  const [accessToken , setAccessToken] = useState(null);
  

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  // Hash function for validation
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

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw new Error(error.message);
      }
      if (user) {
        setCurrentUser(user);
      } else {
        setMessage("No authenticated user found.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setMessage("Error fetching user data.");
    }
  };

  // Get encrypted key from backend
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
        return response.data; // { ciphertext: "...", iv: "..." }
      } else {
        throw new Error("No encrypted key found.");
      }
    } catch (error) {
      console.error("Error fetching encrypted key:", error);
      throw error;
    }
  };

  // Decrypt AES key
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

  // Validate UUID and password
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
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                 },
              }
      );
      if (response.status === 200) {
        const encryptedKeyData = await getEncryptedKey(currentUser.id);
        setEncryptedAesKey(encryptedKeyData);

        setIsUuidValid(true);
        setMessage("UUID validated successfully. You can now record audio.");
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

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Update audio level for visual feedback
  const updateAudioLevel = () => {
    if (analyserRef.current && recording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!isUuidValid) {
      setMessage("Please validate UUID and password first.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext ||
        window.AudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
        streamRef.current = null;
        audioContextRef.current = null;
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000
      );
      updateAudioLevel();
    } catch (error) {
      setMessage(" Could not access microphone: " + error.message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setAudioLevel(0);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (recording) stopRecording();
    setRecording(false);
    setAudioURL("");
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  };

  // Toggle audio playback
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update progress bar during playback
  const updateProgress = () => {
    if (audioRef.current) {
      const progressPercent =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(progressPercent) ? 0 : progressPercent);
    }
  };

  // Encrypt audio blob
  const encryptAudio = async (blob) => {
  try {
    // Decrypt the AES key
    
    const decryptedKeyx = await decryptKey(uuid.trim(), encryptedAesKey, password.trim()); // Adjusted to use ciphertext and iv
    const decryptedKey = CryptoJS.enc.Utf8.parse(decryptedKeyx);
    if (!decryptedKey || decryptedKey.sigBytes === 0) {
      throw new Error("Decrypted key is missing or invalid.");
    }

    // Convert blob to WordArray
    const arrayBuffer = await blob.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer));

    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(16);

    // Encrypt using AES-CBC with PKCS7 padding
    const encrypted = CryptoJS.AES.encrypt(wordArray, decryptedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Concatenate IV and ciphertext
    const encryptedData = iv.concat(encrypted.ciphertext);

    // Convert to Uint8Array for Blob
    const byteArray = new Uint8Array(encryptedData.sigBytes);
    for (let i = 0; i < encryptedData.sigBytes; i++) {
      byteArray[i] = (encryptedData.words[i >> 2] >> (24 - (i % 4) * 8)) & 0xff;
    }

    return new Blob([byteArray], { type: "application/octet-stream" }); // Use generic type to avoid WebM-specific issues
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error(`Failed to encrypt audio: ${error.message}`);
  }
};

  // Upload encrypted audio
  const uploadAudio = async () => {
    if (!audioBlob) {
      setMessage("No audio to upload or missing encryption key.");
      return;
    }
    setIsUploading(true);
    try {
      const encryptedBlob = await encryptAudio(audioBlob);
      // Remove extension
      const safeBaseName = "audio_recording";

      // You can set an extension to indicate original format
      const originalExtension = ".webm";

      const uniqueFileName = `${Date.now()}_${currentUser.id}_${safeBaseName}${originalExtension}.enc`;
      const filePath = `${currentUser.id}/${uniqueFileName}`;
      const file = new File([encryptedBlob], uniqueFileName, {
        type: "audio/webm",
      });


      const { data, error } = await supabase.storage
        .from("voice")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });


      if (error) {
        setMessage(" Upload failed: " + error.message);
        return;
      }

      setMessage(" Upload successful!");


      const fileMetadata = {
        idOfUser: currentUser.id,
        letterFileUrl: null,
        mediaFileUrl: null,
        voiceFileUrl: filePath,
        fileName: "Audio Recording",
        usery: {
          userIdX: currentUser.id,
        },
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/filemetadata`,
        fileMetadata,
        {
          headers: {
            "Content-Type": "application/json",
            
                
                  Authorization: `Bearer ${accessToken}`,
                 
              
          },
        }
      );
      if (response.status === 200 || response.status === 201) {
        setMessage("Letter saved successfully!");
        setUuid("");
        setPassword("");
      } else {
        setMessage("Failed to save letter. Please try again.");
      }

      cancelRecording();
    } catch (err) {
      console.error("Unexpected Upload Error:", err);
      setMessage("Something went wrong during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Initialize user fetch and cleanup
  useEffect(() => {
    fetchCurrentUser();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update progress bar during playback
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("timeupdate", updateProgress);
      return () => {
        audio.removeEventListener("timeupdate", updateProgress);
      };
    }
  }, [audioURL]);

  return (
    <>
      <BackButton />
      <div className="recorder-container">
        <div className="recorder-box">
          <div className="recorder-header">
            <div className="icon-circle">
              <FiMic size={24} />
            </div>
            <h2>Audio Recorder</h2>
            <p>Record high-quality audio messages</p>
          </div>
          <div>
            <input
              type="text"
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              placeholder="User ID"
              className="input-userid"
              required
              style={{
                marginBottom: "10px",
                padding: "0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #ddd",
                width: "100%",
              }}
              disabled={isUuidValid || loading}
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-userid"
              required
              style={{
                marginBottom: "10px",
                padding: "0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #ddd",
                width: "100%",
              }}
              disabled={isUuidValid || loading}
            />
          </div>
          <div>
            <button
              className="btn"
              onClick={validateUuid}
              disabled={loading || isUuidValid}
              style={{
                background: isUuidValid ? "green" : "green",
                color: "white",
                padding: "0.8rem 1rem",
                borderRadius: "1rem",
                border: "none",
                cursor: loading || isUuidValid ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Validating..." : "Validate Secrets"}
            </button>
          </div>
          {message && (
            <div
              style={{
                margin: "1rem 0",
                color: isUuidValid ? "#059669" : "#dc2626",
                fontSize: "0.9rem",
              }}
            >
              {message}
            </div>
          )}

          {recording && (
            <div className="recording-indicator">
              <div className="audio-bars">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="audio-bar"
                    style={{
                      height: `${Math.max(
                        8,
                        audioLevel * 40 + Math.random() * 10
                      )}px`,
                      opacity: audioLevel > 0.1 ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
              <span className="recording-text">Recording...</span>
              <div className="recording-time">{formatTime(recordingTime)}</div>
            </div>
          )}

          <div className="controls">
            {!recording && !audioBlob && (
              <button
                className="btn start"
                onClick={startRecording}
                disabled={!isUuidValid}
              >
                <FiMic size={16} /> Start Recording
              </button>
            )}

            {recording && (
              <>
                <button className="btn stop" onClick={stopRecording}>
                  <FiSquare size={16} /> Stop
                </button>
                <button className="btn cancel" onClick={cancelRecording}>
                  <FiX size={16} /> Cancel
                </button>
              </>
            )}

            {audioURL && (
              <div className="preview-box">
                <audio
                  ref={audioRef}
                  src={audioURL}
                  onEnded={() => setIsPlaying(false)}
                  hidden
                />
                <div className="preview-controls">
                  <span>Your Recording</span>
                  <button onClick={togglePlayback}>
                    {isPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
                  </button>
                </div>
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                ></div>

                <div className="actions">
                  <button
                    className="btn upload"
                    onClick={uploadAudio}
                    disabled={isUploading}
                  >
                    <FiUpload size={16} />{" "}
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                  <button className="btn cancel" onClick={cancelRecording}>
                    <FiX size={16} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="uploading-message">
              <div className="spinner" />
              <span>Uploading your recording...</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UploadPage;