import React from "react";

export default function Toast({ message, onClose }) {
  return (
    <>
      <style>{`
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .toast-slide-down {
          animation: slideDown 0.4s ease forwards;
          position: fixed;
          top: 90px;
          left: 50%;
          background-color: #333;
          color: #fff;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 300px;
          max-width: 600px;
        }
      `}</style>

      <div className="toast-slide-down">
        <span>{message}</span>
        <button
          onClick={onClose}
          style={{
            marginLeft: "16px",
            color: "#fff",
            background: "none",
            border: "none",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ✖
        </button>
      </div>
    </>
  );
}
