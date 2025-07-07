import React, { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient"; // Ensure this path is correct

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Error fetching user info:", userError);
          setMessage("Authentication error. Please log in.");
          setLoading(false);
          return;
        }

        // Fetch user role from your 'death_user' table
        const { data, error: roleError } = await supabase
          .from("death_user")
          .select("user_role")
          .eq("user_idx", user.id)
          .single();

        if (roleError || !data) {
          console.error("Error fetching user role or user not found:", roleError);
          setMessage("Access denied: User role not found or not authorized.");
          setLoading(false);
          return;
        }

        if (data.user_role === "admin") {
          setIsAdmin(true);
          fetchReports(); // Fetch reports only if admin
        } else {
          setMessage("Access denied: Admins only.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error during admin check:", err);
        setMessage("Unexpected error: " + err.message);
        setLoading(false);
      }
    };

    checkAdminRole();
  }, []); // Empty dependency array means this runs once on mount

  const fetchReports = async () => {
    setLoading(true); // Start loading before fetching
    setMessage(""); // Clear previous messages

    try {
      const response = await axios.get(
        "http://localhost:8080/api/admin/death-reports"
      );

      if (response.data && Array.isArray(response.data)) {
        const reportsWithSignedUrls = await Promise.all(
          response.data.map(async (report) => {
            // Check if bucketUrl exists before trying to create a signed URL
            if (report.bucketUrl) {
              // Ensure 'report' is the correct bucket name in Supabase Storage
              const { data, error } = await supabase.storage
                .from("report")
                .createSignedUrl(report.bucketUrl, 60 * 60 * 12); // 12-hour validity

              if (error) {
                console.error(
                  `Error generating signed URL for ${report.bucketUrl}:`,
                  error
                );
                // Return report with null signedEvidenceUrl if there's an error
                return { ...report, signedEvidenceUrl: null };
              }

              // Return report with the generated signed URL
              return { ...report, signedEvidenceUrl: data.signedUrl };
            }
            // If no bucketUrl, return report as is with null signedEvidenceUrl
            return { ...report, signedEvidenceUrl: null };
          })
        );

        setReports(reportsWithSignedUrls);
        if (reportsWithSignedUrls.length === 0) {
          setMessage("No reports available.");
        }
      } else {
        setMessage("Failed to fetch reports: Invalid response format from server.");
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setMessage("Failed to fetch reports: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false); // Stop loading regardless of success or failure
    }
  };

  const findUserAndValidate = async (report) => {
    const secrectKey = report.secretKey;
    console.log("Secret Key for validation:", secrectKey); // Log the secret key for debugging
    try {
      const deadUserResponse = await axios.get(
        `http://localhost:8080/api/deathusers/findUserByHashKey`,
        {
          params: {
            secrectKey: secrectKey
          }
        }
      );
      console.log("Dead User Response:", deadUserResponse); // Log the response for debugging

      const deadUser = deadUserResponse.data;
      console.log("Dead User:", deadUser);

      if (deadUser) {
        // Check if all name, surname, and middleName are matching
        if (
          report.name === deadUser.firstName &&
          report.middleName === deadUser.middleName &&
          report.surname === deadUser.lastname &&
          report.dateOfBirth === deadUser.dateOfBirth
        ) {
          return { isValidated: true, userId: deadUser.userIdX }; // Return userId here
        } else {
          return { isValidated: false, userId: null };
        }
      }
      return { isValidated: false, userId: null }; // If deadUser is null (due to 404 or no data), return false
    } catch (error) {
      // Specifically handle 404 as "user not found" without throwing a hard error
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        console.warn("User not found for secret key:", secrectKey);
        return { isValidated: false, userId: null }; // User not found is a valid "failed validation"
      } else {
        // For other types of errors (e.g., network issues, 500 errors), log and return false
        console.error("Error during user validation:", error);
        return { isValidated: false, userId: null };
      }
    }
  };

  const handleTrigger = async (reportIdX, report) => {
    setMessage(""); // Clear previous messages
    // Improved console log to clearly show the value of reportIdX
    console.log(`reportIdX in handleTrigger: ${reportIdX}`);

    const validationResult = await findUserAndValidate(report); // Await the validation result
    const { isValidated, userId: validatedUserId } = validationResult; // Destructure the result

    if (isValidated) {
      try {
        await axios.post(
          `http://localhost:8080/api/admin/death-reports/trigger`,
          null, // no request body
          {
            params: {
              reportId: reportIdX,
              hash: report.secretKey
            }
          }
        );

        setMessage("Report triggered successfully!");
        fetchReports(); // Refresh reports to update status
      } catch (error) {
        console.error("Failed to trigger report:", error);
        // Log the response data from the backend if available
        if (axios.isAxiosError(error) && error.response && error.response.data) {
          console.error("Backend error response data:", error.response.data);
          setMessage("Failed to trigger report: " + (error.response.data.message || JSON.stringify(error.response.data)));
        } else {
          setMessage("Failed to trigger report: " + (error.message || "Unknown error"));
        }
      }
    } else {
      setMessage("Cannot verify the report: metadata mismatched or user not found.");
    }
  };

  // Display loading state
  if (loading) {
    return <div style={styles.loading}>Loading Admin Dashboard...</div>;
  }

  // Display access denied message if not admin
  if (!isAdmin) {
    return <div style={styles.accessDenied}>{message || "Access Denied."}</div>;
  }

  return (
    <div style={styles.container}>
      <h2>Admin Dashboard - Death Reports</h2>
      {message && <p style={styles.message}>{message}</p>} {/* Display messages here */}

      {reports.length === 0 ? (
        !loading && <p>No reports to display.</p> // Only show if not loading and no reports
      ) : (
        reports.map((report) => {
          // Log report.id here to check its value before rendering the button
          console.log(`Rendering report card for ID: ${report.id}`);
          return (
            <div key={report.id} style={styles.reportCard}>
              <p><strong>Report ID:</strong> {report.id}</p>
              <p><strong>Name:</strong> {report.name}</p>
              <p><strong>Middle Name:</strong> {report.middleName || "None"}</p>
              <p><strong>Surname:</strong> {report.surname}</p>
              <p><strong>Email:</strong> {report.email}</p>
              <p><strong>Details:</strong> {report.reportDetails || "None"}</p>
              {report.signedEvidenceUrl ? (
                <a
                  href={report.signedEvidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.downloadLink}
                >
                  View/Download Certificate
                </a>
              ) : (
                <p style={styles.noCertificate}>No certificate available.</p>
              )}
              <p><strong>Status:</strong> {report.status}</p>
              <div style={styles.buttonContainer}>
                <button
                  onClick={() => handleTrigger(report.id, report)} // Pass the full report object
                  style={{
                    ...styles.button,
                    backgroundColor: report.status === "approved" ? "#6c757d" : "#28a745", // Gray if approved
                    cursor: report.status === "approved" ? "not-allowed" : "pointer",
                    opacity: report.status === "approved" ? 0.6 : 1,
                  }}
                  disabled={report.status === "approved"} // Disable if already approved
                >
                  {report.status === "approved" ? "Approved" : "Trigger Approval"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "900px",
    margin: "20px auto",
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    fontSize: "1.2em",
    color: "#555",
  },
  accessDenied: {
    textAlign: "center",
    padding: "50px",
    fontSize: "1.2em",
    color: "#d9534f",
    fontWeight: "bold",
  },
  reportCard: {
    border: "1px solid #e0e0e0",
    padding: "20px",
    marginBottom: "15px",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba",
  },
  buttonContainer: {
    marginTop: "15px",
    textAlign: "right",
  },
  button: {
    padding: "10px 20px",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "1em",
    fontWeight: "bold",
    transition: "background-color 0.3s ease, opacity 0.3s ease",
  },
  message: {
    marginTop: "10px",
    marginBottom: "20px",
    padding: "10px",
    textAlign: "center",
    backgroundColor: "#ffe0b2", // Light orange for warnings/info
    color: "#e65100", // Darker orange text
    borderRadius: "5px",
    fontWeight: "bold",
  },
  downloadLink: {
    display: "inline-block",
    marginTop: "10px",
    color: "#007bff",
    textDecoration: "none",
    fontWeight: "bold",
    borderBottom: "1px solid #007bff",
    paddingBottom: "2px",
    transition: "color 0.2s ease, border-color 0.2s ease",
  },
  "downloadLink:hover": { // Note: This pseudo-class won't work directly in inline styles. For hover, use a CSS stylesheet or a library like styled-components.
    color: "#0056b3",
    borderColor: "#0056b3",
  },
  noCertificate: {
    fontStyle: "italic",
    color: "#777",
    marginTop: "10px",
  }
};

export default AdminDashboard;
