import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DragNdrop from "../components/DragNDrop";
import BackButton from "../components/BackButton";

const DeathReportForm = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [secretId, setSecretId] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [isUuidValid, setIsUuidValid] = useState(false);
  const [key, setKey] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [accessToken, setAccessToken] = useState(null);

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

  useEffect(() => {
    const fetchUser = async () => {
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
    };
    fetchUser();
  }, [navigate]);

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
    if (!currentUser) {
      setMessage("Please wait for user data to load.");
      return;
    }
    if (!secretId.trim() || !password.trim()) {
      setMessage("UUID and password are required.");
      return;
    }

    setLoading(true);
    try {
      const input = secretId.trim() + "Vedant_Kasar" + password.trim();
      const hashedToken = await hashWithSalt(input);
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/deathusers/findHashToken/${hashedToken}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      //finded hashtoken of current user (this is because user cant able to fool me with entering his own credentials)
      const check = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/deathusers/findHashTokenByUUID/${
          currentUser.id
        }`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200 && check.data !== hashedToken) {
        setIsUuidValid(true);
        setMessage("UUID validated successfully. You can now upload a file.");
        setKey(hashedToken); // Store the hashed token for later use
      } else {
        setIsUuidValid(false);
        setMessage("Invalid UUID or password. Please check and try again.");
      }
    } catch (error) {
      console.error("Validation error:", error);
      setIsUuidValid(false);
      if (error.response && error.response.status === 404) {
        setMessage("Validation endpoint not found or invalid UUID/password.");
      } else {
        setMessage(
          `Validation failed: ${error.message || "Please try again."}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setMessage("You must be logged in to report a death.");
      return;
    }
    // Added dob and middleName to required fields check
    if (!name || !middleName || !surname || !file || !email || !dob) {
      setMessage(
        "Please fill in all required fields and upload a death certificate."
      );
      return;
    }

    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const bucket = "report";
      const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove original extension
      const safeName = originalName.replace(/[^\w\-]+/g, "_");
      const uniqueFileName = `${currentUser.id}_${Date.now()}_${safeName}`;
      const filePath = `${currentUser.id}/${uniqueFileName}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Failed to upload to Supabase: ${uploadError.message}`);
      }

      const reportData = {
        bucketUrl: filePath,
        name: name.toLowerCase(),
        middleName: middleName.toLowerCase(),
        surname: surname.toLowerCase(),
        reportDetails: reportDetails || null,
        email: email,
        secretKey: key, // Corrected from secrectKey to secretKey
        dateOfBirth: dob, // Added date of birth field
        status: "pending",
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/death-reports`,
        reportData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setMessage("Death report submitted successfully!");
      setName("");
      setSurname("");
      setReportDetails("");
      setFile(null);
      setEmail(""); // Clear email field after submission
      setDob(""); // Clear dob field after submission
      setMiddleName(""); // Clear middleName after submission
      setSecretId(""); // Clear secretId after submission
      setPassword(""); // Clear password after submission
      setIsUuidValid(false); // Reset UUID validation state
      setKey(""); // Clear stored key
    } catch (error) {
      console.error("Report error:", error);
      setMessage(error.message || "Failed to submit death report.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div>Loading...</div>;

  return (
    <>
      <BackButton />
      <div style={styles.container}>
        <h2 style={styles.header}>Report a Death</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>ID</label>
            <input
              type="text"
              value={secretId}
              onChange={(e) => setSecretId(e.target.value)}
              placeholder="Enter the secret ID of the Deceased user"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the Password of the Deceased user  "
              style={styles.input}
              required
            />
          </div>

          {!isUuidValid && (
            <button
              type="button"
              onClick={validateUuid}
              disabled={loading}
              style={{ ...styles.button, background: "green" }}
            >
              {loading ? "Validating..." : "Validate UUID"}
            </button>
          )}
          <fieldset
            style={{ border: "none", padding: 0 }}
            disabled={!isUuidValid}
          >
            {" "}
            {/* Disable fields until UUID is valid */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))
                }
                placeholder="Enter the user’s name"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Middle Name</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) =>
                  setMiddleName(
                    e.target.value.toLowerCase().replace(/[^a-z]/g, "")
                  )
                }
                placeholder="Enter the user’s Middle Name"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Surname</label>
              <input
                type="text"
                value={surname}
                onChange={(e) =>
                  setSurname(
                    e.target.value.toLowerCase().replace(/[^a-z]/g, "")
                  )
                }
                placeholder="Enter the user’s surname"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Date of Birth</label>
              <input
                type="date" // Kept as text as per original, but type="date" could be considered
                value={dob} // Corrected: value should be dob
                onChange={(e) => setDob(e.target.value)} // Corrected: onChange should set dob
                placeholder="Enter Date of Birth (DD-MM-YYYY)"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>{" "}
              {/* Changed label to "Email" */}
              <input
                type="email" // Changed type to "email" for better validation
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the user’s email"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Details (Optional)</label>{" "}
              {/* Added (Optional) */}
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional details (e.g., date of death, place of death)"
                style={styles.textarea}
              />
            </div>
            <div>
              <label style={styles.label}>
                Upload Death Certificate (PDF only)
              </label>{" "}
              {/* Clarified file type */}
              <div>
                <DragNdrop onFilesSelected={setFile} />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !isUuidValid}
              style={styles.button}
            >
              {" "}
              {/* Disable submit if not validated */}
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </fieldset>
        </form>
        {message && (
          <p
            style={message.includes("success") ? styles.success : styles.error}
          >
            {message}
          </p>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: "2.5rem",
    maxWidth: "650px",
    margin: "2rem auto",
    background: "#ffffffcc",
    borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
  },
  header: {
    color: "#1f2937",
    fontSize: "1.75rem",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  inputGroup: {
    marginBottom: "1.25rem",
  },
  label: {
    color: "#374151",
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "0.5rem",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#f9fafb",
    transition: "border-color 0.3s ease",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    minHeight: "120px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#f9fafb",
    resize: "vertical",
  },
  button: {
    padding: "1rem 2rem",
    background: "linear-gradient(135deg,rgb(45, 126, 49),rgb(45, 126, 49))",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginTop: "1rem",
    transition: "background 0.3s ease",
    boxShadow: "0 4px 10px rgba(45, 126, 49, 0.3)", // Added subtle shadow
  },
  success: {
    color: "#047857",
    backgroundColor: "#d1fae5",
    border: "1px solid #10b981",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1.25rem",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    border: "1px solid #ef4444",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1.25rem",
  },
};

export default DeathReportForm;
