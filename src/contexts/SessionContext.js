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
  const [usuario, setUsuario] = useState(null);
  const [accessToken, setAccessToken] = useState(null); // Agregado

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

    const savedUsuario = sessionStorage.getItem("usuario");
    if (savedUsuario) {
      setUsuario(JSON.parse(savedUsuario));
    }
  }, []);

  const updateSessionKey = async (key) => {
    setSessionKey(key);
    const exported = await window.crypto.subtle.exportKey("raw", key);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    sessionStorage.setItem("sessionKey", base64);
  };

  const updateUsuario = (user) => {
    setUsuario(user);
    sessionStorage.setItem("usuario", JSON.stringify(user));
  };

  const updateAccessToken = (token) => {
    setAccessToken(token);
  };

  const logout = () => {
    setSessionKey(null);
    setUsuario(null);
    setAccessToken(null);
    sessionStorage.removeItem("sessionKey");
    sessionStorage.removeItem("usuario");
  };

  return (
    <SessionContext.Provider value={{
      sessionKey,
      updateSessionKey,
      usuario,
      updateUsuario,
      accessToken,
      updateAccessToken,
      logout
    }}>
      {children}
    </SessionContext.Provider>
  );
};
