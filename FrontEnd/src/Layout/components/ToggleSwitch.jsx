import React, { useState } from "react";
import axios from "axios";

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
            style={{
                padding: "10px 20px",
                backgroundColor: enabled ? "#28a745" : "#dc3545", // nice green/red shades
                color: "white",
                border: "none",
                borderRadius: "25px", // fully rounded
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                minWidth: "150px",
                transition: "background-color 0.3s ease",
            }}

        >
            {loading ? "Updating..." : enabled ? "Monitoring ON" : "Monitoring OFF"}
        </button>
    );
};

export default MonitoringToggle;
