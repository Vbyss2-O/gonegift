import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ToggleSwitch.css";
import { supabase } from "../Death/supabaseClient";

const MonitoringToggle = ({ userId, initialEnabled }) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newStatus = !enabled;
      await axios.put(
        `http://localhost:8080/api/deathusers/toggle/${userId}?enabled=${newStatus}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setEnabled(newStatus);
    } catch (error) {
      console.error("Error updating monitoring status", error);
      alert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        return;
      }

      const token = data.session?.access_token;

      if (token) {
        setAccessToken(token);
      } else {
        console.warn("No access token found—user probably signed out.");
      }
    };

    initAuth();
  }, []);

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`monitoring-button ${enabled ? "" : "monitoring-off"}`}
    >
      {loading ? "Updating..." : enabled ? "Monitoring ON" : "Monitoring OFF"}
    </button>
  );
};

export default MonitoringToggle;
