import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

const FileList = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get logged-in user
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error("Error fetching user:", error?.message || "No user found");
          navigate("/login");
          return;
        }

        // Fetch user details from death_user table
        const { data: existingUser, error: fetchError } = await supabase
          .from("death_user")
          .select("first_name, lastname, user_role")
          .eq("user_idx", user.id)
          .limit(1)
          .maybeSingle();

        if (fetchError || !existingUser) {
          console.error("Error fetching user data:", fetchError || "User not found in death_user table");
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
        fetchFiles(user.id);
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
      const response = await fetch(`http://localhost:8080/api/deathusers/listOfFiles/${userId}`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await fetch(`http://localhost:8080/api/filemetadata/deleteFileMetadataById/${fileId}`, {
        method: "DELETE",
      });
      setFiles(files.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="file-list-container">
      <h2 className="welcome-header">Welcome, {userData?.firstName} {userData?.lastname}</h2>
      <h3 className="files-header">Your Uploaded Files:</h3>
      {files.length === 0 ? (
        <p className="no-files">No files found.</p>
      ) : (
        <ul className="file-list">
          {files.map((file) => (
            <li key={file.id} className="file-item">
              <div className="file-info">
                <div className="file-type">
                  <strong>File Type:</strong> {file.fileType}
                </div>
                <div className="file-url">
                  <strong>File URL:</strong> 
                  <a 
                    href={file.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    View File
                  </a>
                </div>
              </div>
              <button 
                onClick={() => deleteFile(file.id)}
                className="delete-button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <style jsx>{`
        .file-list-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .welcome-header {
          color: #2c3e50;
          font-size: 24px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #ecf0f1;
        }

        .files-header {
          color: #34495e;
          font-size: 20px;
          margin: 20px 0;
        }

        .no-files {
          color: #7f8c8d;
          font-style: italic;
          padding: 20px;
          text-align: center;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .file-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          margin: 10px 0;
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .file-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .file-info {
          flex: 1;
        }

        .file-type, .file-url {
          margin: 5px 0;
        }

        .file-link {
          color: #3498db;
          text-decoration: none;
          margin-left: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          background-color: #ebf5fb;
          transition: background-color 0.2s ease;
        }

        .file-link:hover {
          background-color: #d4e6f1;
          text-decoration: underline;
        }

        .delete-button {
          background-color: #e74c3c;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 14px;
        }

        .delete-button:hover {
          background-color: #c0392b;
        }

        @media (max-width: 600px) {
          .file-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .delete-button {
            margin-top: 10px;
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default FileList;
