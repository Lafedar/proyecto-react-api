import React from 'react';
export default function Toast({ message, onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#333",
      color: "#fff",
      padding: "12px 24px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: "300px",
      maxWidth: "600px"
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{
        marginLeft: "16px",
        color: "#fff",
        background: "none",
        border: "none",
        fontSize: "16px",
        cursor: "pointer"
      }}>✖</button>
    </div>
  );
}
