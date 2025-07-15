import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./FileList.css"; // Import the CSS file
import BackButton from "../components/BackButton"; // Import the BackButton component

const FileList = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
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
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          console.error(
            "Error fetching user:",
            error?.message || "No user found"
          );
          navigate("/login");
          return;
        }

        const { data: existingUser, error: fetchError } = await supabase
          .from("death_user")
          .select("first_name, lastname, user_role")
          .eq("user_idx", user.id)
          .limit(1)
          .maybeSingle();

        if (fetchError || !existingUser) {
          console.error(
            "Error fetching user data:",
            fetchError?.message || "User not found in death_user table"
          );
          navigate("/login");
          return;
        }

        setUserData({
          userIdX: user.id,
          email: user.email,
          firstName: existingUser.first_name,
          lastname: existingUser.lastname,
        });

        // Fetch files using the user ID
        // Ensure accessToken is available before fetching files
        // The dependency array of this useEffect now includes accessToken to re-run when it's set
        if (accessToken) {
            await fetchFiles(user.id);
            await fetchSharedFiles(user.id);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error.message);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, accessToken]); // Added accessToken to dependency array

  const fetchFiles = async (userId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/deathusers/listOfFiles/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Check if response is OK (status 200-299)
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        // Attempt to read error message from body if available
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          console.error("API Error Response:", errorData.error || errorText);
        } catch (e) {
          console.error("API Error Response (non-JSON):", errorText);
        }
        setFiles([]);
        return; // Exit if response not OK
      }

      // Check if the response has content and is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setFiles(data);
        } else if (data) { // If it's a single object, wrap it in an array
          setFiles([data]);
        } else { // Handle empty but valid JSON response
          console.warn("Received empty but valid JSON data for user files.");
          setFiles([]);
        }
      } else {
        console.warn("Received non-JSON response for user files.");
        setFiles([]);
      }
    } catch (error) {
      console.error("Error fetching user files:", error);
      setFiles([]);
    }
  };

  const fetchSharedFiles = async (userId) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/deathusers/listOfSharedFile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Check if response is OK (status 200-299)
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        // Attempt to read error message from body if available
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          console.error("API Error Response:", errorData.error || errorText);
        } catch (e) {
          console.error("API Error Response (non-JSON):", errorText);
        }
        setSharedFiles([]);
        return; // Exit if response not OK
      }

      // Check if the response has content and is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSharedFiles(data);
        } else if (data) { // If it's a single object, wrap it in an array
          setSharedFiles([data]);
        } else { // Handle empty but valid JSON response
          console.warn("Received empty but valid JSON data for shared files.");
          setSharedFiles([]);
        }
      } else {
        console.warn("Received non-JSON response for shared files.");
        setSharedFiles([]);
      }
    } catch (error) {
      console.error("Error fetching shared files:", error);
      setSharedFiles([]);
    }
  };

  const deleteFile = async (fileId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/filemetadata/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        // Filter out the deleted file from both lists
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
        // Also refresh the shared files list in case it was a shared file you owned
        if (userData?.userIdX) {
            await fetchSharedFiles(userData.userIdX);
        }
      } else {
        const errorText = await response.text();
        let errorMessage = "Failed to delete file";
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            errorMessage = errorText || errorMessage;
        }
        console.error("Failed to delete file:", errorMessage);
        alert(`Failed to delete file: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(`Error deleting file: ${error.message}`);
    }
  };

  const delteSharedFile = async (fileId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/shared-file/delete/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        // Filter out the deleted file from shared files list
        setSharedFiles((prevSharedFiles) =>
          prevSharedFiles.filter((file) => file.id !== fileId)
        );
      } else {
        const errorText = await response.text();
        let errorMessage = "Failed to delete shared file";
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            errorMessage = errorText || errorMessage;
        }
        console.error("Failed to delete shared file:", errorMessage);
        alert(`Failed to delete shared file: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error deleting shared file:", error);
      alert(`Error deleting shared file: ${error.message}`);
    }
  };

  const getFileTypeFromUrl = (url) => {
    if (!url) return "unknown";
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/");
      const filenameWithEnc = pathSegments[pathSegments.length - 1];

      const parts = filenameWithEnc.split(".");
      if (parts.length < 2) {
        return "unknown";
      }
      // if the last part is "enc", then the actual extension is the second to last part
      if (parts[parts.length - 1] === "enc" && parts.length >= 2) {
        return parts[parts.length - 2];
      }
      // otherwise, return the last part as the extension
      return parts[parts.length - 1];
    } catch (e) {
      console.error("Error parsing file URL:", e);
      return "unknown";
    }
  };

  if (loading) {
    return (
      <div className="filelist-loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <BackButton /> {/* Moved BackButton here to be outside the main div */}
      <div className="filelist-list-container">
        <h2 className="filelist-welcome-header">
          Welcome, {userData?.firstName} {userData?.lastname}
        </h2>

        <h3 className="filelist-files-header">Your Uploaded Files:</h3>
        <p className="filelist-note">
          Note: Your all files are Encrypted and Stored securely so Delete files
          from their names only.
        </p>

        {!Array.isArray(files) || files.length === 0 ? (
          <p className="filelist-no-files">No files uploaded by you yet.</p>
        ) : (
          <ul className="filelist-file-list">
            {files.map((file) => (
              <li key={file.id || Math.random()} className="filelist-file-item">
                <div className="filelist-file-info">
                  <div className="filelist-file-name">
                    <strong>File Name:</strong> {file.fileName}
                  </div>
                  <div className="filelist-file-type-display">
                    <strong>File Type:</strong>{" "}
                    {file.letterFileUrl != null ? "Letter File" : "Media File"}
                  </div>
                </div>
                <button
                  onClick={() => deleteFile(file.id)}
                  className="filelist-delete-button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <hr className="filelist-separator" />

        <h3 className="filelist-files-header">Files from Shared Space:</h3>

        {!Array.isArray(sharedFiles) || sharedFiles.length === 0 ? (
          <p className="filelist-no-files">No files found in shared spaces.</p>
        ) : (
          <ul className="filelist-file-list">
            {sharedFiles
              .filter((file) => file.uploadFileUrl != null) // This is the crucial change
              .map((file) => (
                <li
                  key={file.id || Math.random()}
                  className="filelist-file-item"
                >
                  <div className="filelist-file-info">
                    <div className="filelist-file-name">
                      <strong>File Name:</strong> {file.fileName}
                    </div>
                    <div className="filelist-file-type-display">
                      <strong>File Type:</strong>{" "}
                      {getFileTypeFromUrl(file.uploadFileUrl)}
                    </div>
                  </div>
                  <button
                    onClick={() => delteSharedFile(file.id)}
                    className="filelist-delete-button"
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default FileList;