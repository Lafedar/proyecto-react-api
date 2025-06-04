import React from 'react';
import '../styles/Toast.css';

export default function Toast({ message, onClose }) {
  return (
    <div className="toast">
      <span>{message}</span>
      <a onClick={onClose}>✖</a>
    </div>
  );
}
