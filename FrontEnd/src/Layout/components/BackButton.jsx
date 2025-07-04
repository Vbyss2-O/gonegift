import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
        onClick={() => navigate(-1)}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          zIndex: 1000 // ensures it's always visible above other content
        }}
        aria-label="Go back"
      >
        <img
          src="/back.png"
          alt="Back"
          style={{ width: "30px", height: "30px" }}
        />
      </button>
  );
}
