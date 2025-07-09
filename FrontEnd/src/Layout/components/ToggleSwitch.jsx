import React, { useState } from "react";
import axios from "axios";
import "./ToggleSwitch.css";

const MonitoringToggle = ({ userId, initialEnabled }) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newStatus = !enabled;
      await axios.put(`http://localhost:8080/api/deathusers/toggle/${userId}?enabled=${newStatus}`);
      setEnabled(newStatus);
    } catch (error) {
      console.error("Error updating monitoring status", error);
      alert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

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
