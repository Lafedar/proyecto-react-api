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

  // Cargar sessionKey desde localStorage al iniciar
  useEffect(() => {
    const savedKey = localStorage.getItem("sessionKey");
    if (savedKey) {
      setSessionKey(savedKey);
    }
  }, []);

  // Actualizar sessionKey en estado y localStorage
  const updateSessionKey = (key) => {
    setSessionKey(key);
    localStorage.setItem("sessionKey", key); // 🔐 Persistir
  };

  return (
    <SessionContext.Provider value={{ sessionKey, updateSessionKey }}>
      {children}
    </SessionContext.Provider>
  );
};
