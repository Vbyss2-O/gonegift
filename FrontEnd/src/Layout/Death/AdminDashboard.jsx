import React, { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient";

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setMessage("Error fetching user info.");
          setLoading(false);
          return;
        }

        const { data, error: roleError } = await supabase
          .from("death_user")
          .select("user_role")
          .eq("user_idx", user.id)
          .single();

        if (roleError || !data) {
          setMessage("Access denied: Admins only.");
          setLoading(false);
          return;
        }

        if (data.user_role === "admin") {
          setIsAdmin(true);
          fetchReports();
        } else {
          setMessage("Access denied: Admins only.");
          setLoading(false);
        }
      } catch (err) {
        setMessage("Unexpected error: " + err.message);
        setLoading(false);
      }
    };

    checkAdminRole();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/admin/death-reports");

      if (response.data && Array.isArray(response.data)) {
        setReports(response.data);
      } else {
        setMessage("Invalid response format.");
      }
    } catch (error) {
      setMessage("Failed to fetch reports: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async (reportId) => {
    try {
      await axios.post(`http://localhost:8080/api/admin/death-reports/trigger/${reportId}`);
      setMessage("Report triggered successfully!");
      fetchReports(); // Refresh reports after triggering
    } catch (error) {
      setMessage("Failed to trigger report: " + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!isAdmin) return <div>{message}</div>;

  return (
    <div style={styles.container}>
      <h2>Admin Dashboard - Death Reports</h2>
      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        reports.map((report) => (
          <div key={report.id} style={styles.reportCard}>
            <p>Secret ID: {report.secretId}</p>
            <p>Name: {report.name}</p>
            <p>Surname: {report.surname}</p>
            <p>Details: {report.reportDetails || "None"}</p>
            {report.evidenceUrl && (
              <a href={report.evidenceUrl} target="_blank" rel="noopener noreferrer">
                View Evidence
              </a>
            )}
            <p>Status: {report.status}</p>
            <div style={styles.buttonContainer}>
              <button
                onClick={() => handleTrigger(report.id)}
                style={{
                  ...styles.button,
                  cursor: report.status === "approved" ? "not-allowed" : "pointer",
                  opacity: report.status === "approved" ? 0.6 : 1,
                }}
                disabled={report.status === "approved"}
              >
                Trigger
              </button>
            </div>

          </div>
        ))
      )}
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  container: { padding: "20px", maxWidth: "800px", margin: "0 auto" },
  reportCard: { border: "1px solid #ccc", padding: "15px", marginBottom: "15px" },
  buttonContainer: { marginTop: "10px" },
  button: {
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    transition: "opacity 0.3s ease",
  },
  message: { marginTop: "10px", textAlign: "center" },
};

export default AdminDashboard;
