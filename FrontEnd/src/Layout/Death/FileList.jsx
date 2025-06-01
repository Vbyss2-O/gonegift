import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
//here basic fix i want to impliment that i can store the uuid key in amazon sdk or somekind of localstorage flag i am going to store in localstorage
//that for uuid exist

const FileList = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);

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
            fetchError || "User not found in death_user table"
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

      // Ensure data is an array
      if (Array.isArray(data)) {
        setFiles(data);
      } else {
        console.error("Received non-array data:", data);
        setFiles([]); //empty array set
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]); // Set empty array on error
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
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      } else {
        console.error("Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      <h2 className="welcome-header">
        Welcome, {userData?.firstName} {userData?.lastname}
      </h2>
      <h3 className="files-header">Your Uploaded Files:</h3>
      <h4>
        Note : Your all files are Encrypted and Stored securly so Delete files
        from there names only
      </h4>
      <br />

      {!Array.isArray(files) || files.length === 0 ? (
        <p className="no-files">No files found.</p>
      ) : (
        <ul className="file-list">
          {files.map((file) => (
            <li key={file.id || Math.random()} className="file-item">
              <div className="file-info">
                <div className="file-type">
                  <strong>File Name:</strong> {file.fileName}
                </div>
                {/* <div className="file-url">
                  <strong>File URL:</strong>

                  {file.letterFileUrl && !file.mediaFileUrl && (
                    <a
                      href={file.letterFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      View Letter File
                    </a>
                  )}

                  {file.mediaFileUrl && !file.letterFileUrl && (
                    <a
                      href={file.mediaFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      View Media File
                    </a>
                  )}

                  {file.letterFileUrl && file.mediaFileUrl && (
                    <>
                      <div>
                        <a
                          href={file.letterFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          View Letter File
                        </a>
                      </div>
                      <div>
                        <a
                          href={file.mediaFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          View Media File
                        </a>
                      </div>
                    </>
                  )}
                </div> */}
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
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }

        .file-list-container {
          max-width: 900px;
          margin: 40px auto;
          padding: 30px;
          background-color: var(--bg-glass, #ffffff);
          border-radius: 16px;
          box-shadow: var(--shadow-rainbow, 0 8px 20px rgba(0, 0, 0, 0.08));
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .welcome-header {
          color: var(--text-primary, #2c3e50);
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .files-header {
          color: var(--text-primary, #34495e);
          font-size: 22px;
          margin: 24px 0 12px;
        }

        .no-files {
          color: var(--text-secondary, #7f8c8d);
          font-style: italic;
          padding: 24px;
          text-align: center;
          background: var(--bg-glass, #f8f9fa);
          border-radius: 10px;
          font-size: 16px;
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
          padding: 18px;
          margin: 12px 0;
          background: var(--bg-glass, #f9f9f9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          box-shadow: var(--shadow-md, 0 2px 6px rgba(0, 0, 0, 0.05));
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .file-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg, 0 6px 12px rgba(0, 0, 0, 0.12));
        }

        .file-info {
          flex: 1;
          color: var(--text-primary, #2c3e50);
        }

        .file-type,
        .file-url {
          margin: 4px 0;
          font-size: 15px;
          word-break: break-word;
        }

        .file-link {
          color: var(--primary, #3498db);
          text-decoration: none;
          margin-left: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          background-color: rgba(0, 123, 255, 0.1);
          font-weight: 500;
          transition: background-color 0.2s ease;
        }

        .file-link:hover {
          background-color: rgba(0, 123, 255, 0.2);
          text-decoration: underline;
        }

        .delete-button {
          background-color: var(--accent5, #e74c3c);
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .delete-button:hover {
          background-color: #c0392b;
        }

        @media (max-width: 768px) {
          .file-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .delete-button {
            margin-top: 10px;
            align-self: flex-end;
          }

          .file-link {
            margin-left: 0;
            margin-top: 8px;
          }

          .file-info {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default FileList;
