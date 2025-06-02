import React, { createContext, useContext, useState, useEffect } from 'react';

// Crear el contexto
const SessionContext = createContext();

// Hook para usar el contexto
export const useSession = () => {
  return useContext(SessionContext);
};

// Proveedor del contexto
export const SessionProvider = ({ children }) => {
  const [sessionKey, setSessionKey] = useState(null);

 
  useEffect(() => {
    const savedKey = sessionStorage.getItem("sessionKey");
    if (savedKey) {
      const raw = Uint8Array.from(atob(savedKey), c => c.charCodeAt(0));
      window.crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      ).then(importedKey => {
        setSessionKey(importedKey);
      }).catch(console.error);
    }
  }, []);


  // Actualizar sessionKey en estado y sessionStorage
  const updateSessionKey = async (key) => {
    setSessionKey(key);
    const exported = await window.crypto.subtle.exportKey("raw", key);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    sessionStorage.setItem("sessionKey", base64);
  };

  return (
    <SessionContext.Provider value={{ sessionKey, updateSessionKey }}>
      {children}
    </SessionContext.Provider>
  );
};

