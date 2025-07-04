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
        await fetchFiles(user.id);
        await fetchSharedFiles(user.id);
      } catch (error) {
        console.error("Error in fetchUserData:", error.message);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const fetchFiles = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/deathusers/listOfFiles/${userId}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        setFiles(data);
      } else {
        console.error("Received non-array data for user files:", data);
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
        `http://localhost:8080/api/deathusers/listOfSharedFile/${userId}`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setSharedFiles(data);
      } else {
        console.error("Received non-array data for shared files:", data);
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
        `http://localhost:8080/api/filemetadata/${fileId}`,
        {
          method: "DELETE",
        }
      );
      console.log("Delete response:", response);

      if (response.ok) {
        // Filter out the deleted file from both lists
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
        setSharedFiles((prevSharedFiles) => prevSharedFiles.filter((file) => file.id !== fileId));
      } else {
        console.error("Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const getFileTypeFromUrl = (url) => {
    if (!url) return "unknown";
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/');
      const filenameWithEnc = pathSegments[pathSegments.length - 1]; 

      const parts = filenameWithEnc.split('.');
      if (parts.length < 2) {
        return "unknown";
      }
      // if the last part is "enc", then the actual extension is the second to last part
      if (parts[parts.length - 1] === 'enc' && parts.length >= 2) {
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
     

      {
        !Array.isArray(sharedFiles) || sharedFiles.length === 0 ? (
          <p className="filelist-no-files">No files found in shared spaces.</p>
        ) : (
          <ul className="filelist-file-list">
            {sharedFiles
              .filter(file => file.uploadFileUrl != null) // This is the crucial change
              .map((file) => (
                <li key={file.id || Math.random()} className="filelist-file-item">
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
                    onClick={() => deleteFile(file.id)}
                    className="filelist-delete-button"
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        )
      }
    </div>
    </>
  );
};

export default FileList;