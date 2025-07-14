import React from 'react';
import './GoneGiftLogo.css'; // Import the CSS file

const GoneGiftLogo = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: 'white'
    }}>
      <h2 className="logo-glitch" data-text="GoneGift" style={{
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "35px",
        fontWeight: 600,
        letterSpacing: "1px",
        color: "#2c3e50",
        margin: "0",
        padding: "0"
      }}>
        GoneGift
      </h2>
    </div>
  );
};

export default GoneGiftLogo;