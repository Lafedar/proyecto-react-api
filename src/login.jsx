import { createRoot } from 'react-dom/client'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';


import './styles/App.css';

function Login() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [serverPublicKey, setServerPublicKey] = useState(null); // Estado para la clave pública RSA del servidor
    const navigate = useNavigate();

    //Convierte una cadena de texto Base64 a un ArrayBuffer (tipo de dato binario en js)
    const _base64ToArrayBuffer = (base64) => {   
        const binaryString = window.atob(base64); 
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    // Convierte ArrayBuffer a Base64 (necesario para enviar por HTTP)
    const _arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    useEffect(() => {
        const fetchAndImportPublicKey = async () => {   //obtiene e importa la clave pública del servidor
            try {
                const response = await fetch(`${API_BASE}/api/public-key`, {
                    method: 'GET', 
                    headers: {
                        'ngrok-skip-browser-warning': 'true'
                    }
                });
                if (!response.ok) {
                    throw new Error(`Error HTTP al obtener clave pública: ${response.status}`);
                }
                const pemKey = await response.text();

                // Eliminar encabezados/pies de página PEM y saltos de línea para obtener el Base64 puro
                const base64Key = pemKey
                    .replace('-----BEGIN PUBLIC KEY-----', '')
                    .replace('-----END PUBLIC KEY-----', '')
                    .replace(/\s/g, ''); // Eliminar todos los espacios en blanco

        
                const binaryDer = _base64ToArrayBuffer(base64Key);
                
                // Importar la clave pública en formato Web Crypto API para cifrado RSA-OAEP
                const importedKey = await window.crypto.subtle.importKey(
                    "spki", // Formato SubjectPublicKeyInfo para claves públicas RSA
                    binaryDer,
                    {
                        name: "RSA-OAEP",
                        hash: "SHA-1", // El hash debe coincidir con el usado en Laravel
                    },
                    true, // La clave es extractable (aunque no la extraeremos de nuevo)
                    ["encrypt"] // Solo se usará para cifrar
                );
                setServerPublicKey(importedKey); // Almacenar la clave importada en el estado
            } catch (err) {
                console.error("Error al obtener o importar la clave pública del servidor:", err);
                setError("No se pudo cargar la clave de cifrado. Por favor, intente de nuevo.");
            }
        };

        fetchAndImportPublicKey();
    }, [API_BASE]); 

    // --- Funciones de Cifrado ---

    // 1. Genera una clave AES-GCM aleatoria para cada sesión de login
    async function generateAesGcmKey() {
        return await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256, // AES-256
            },
            true, // La clave debe ser exportable para poder cifrarla con RSA
            ["encrypt", "decrypt"]
        );
    }

    // 2. Cifra el mensaje (email y contraseña) con la clave AES-GCM
    async function encryptMessageWithAesGcm(message, aesKey) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV de 12 bytes para AES-GCM
        const encodedMessage = new TextEncoder().encode(message);

        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            aesKey, // Usa la clave AES-GCM generada
            encodedMessage
        );

        // Retorna el ciphertext y el IV en Base64
        return {
            ciphertext: _arrayBufferToBase64(ciphertext), // Incluye el Auth Tag al final
            iv: _arrayBufferToBase64(iv),
        };
    }

    // 3. Cifra la clave AES-GCM con la clave pública RSA del servidor
    async function encryptAesKeyWithRsa(aesKey, rsaPublicKey) {
        // Primero, exporta la clave AES-GCM (que es un CryptoKey object) a su formato 'raw' (bytes)
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

        // Luego, cifra esos bytes de la clave AES-GCM usando la clave pública RSA-OAEP del servidor
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            rsaPublicKey, // Usa la clave pública RSA del servidor
            exportedAesKey
        );

        // Retorna la clave AES-GCM cifrada en Base64
        return _arrayBufferToBase64(encryptedAesKey);
    }

    // --- Manejador de Login ---
    const handleLogin = async (e) => {
        e.preventDefault();

        // Asegurarse de que la clave pública RSA del servidor se haya cargado
        if (!serverPublicKey) {
            setError("Clave de cifrado del servidor no disponible. Por favor, espere o recargue.");
            return;
        }

        const payload = JSON.stringify({ email, password });

        try {
            // A. Generar la clave AES-GCM aleatoria para esta sesión de login
            const aesKey = await generateAesGcmKey();

            // B. Cifrar el payload (email y password) con la clave AES-GCM
            const { ciphertext, iv } = await encryptMessageWithAesGcm(payload, aesKey);

            // C. Cifrar la clave AES-GCM (generada en A) con la clave pública RSA del servidor
            const encryptedAesKey = await encryptAesKeyWithRsa(aesKey, serverPublicKey);

            // D. Enviar todos los componentes cifrados al servidor
            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // Mantener si usas ngrok en desarrollo
                },
                credentials: 'include', // Para enviar cookies (sesiones)
                body: JSON.stringify({
                    payload: ciphertext,          // Payload cifrado con AES-GCM
                    iv: iv,                       // IV para AES-GCM
                    encryptedAesKey: encryptedAesKey // La clave AES-GCM, pero cifrada con RSA
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                alert('Login exitoso'); 
                navigate('/links');
            } else {
                alert('Credenciales incorrectas'); 
            }
        } catch (error) {
            console.error('Error durante el proceso de login:', error);
            displayMessage('Error al conectar con el servidor o al cifrar datos.', 'error');
        }
    };

    
    const displayMessage = (msg, type) => {
        
        setError(msg);
        
    };

    //Vista que voy a mostrar en el index.html
    return (

        <div>
            <form className="login-form" onSubmit={handleLogin}>
                <h1 className="text-x1 font-bold text-white-600">Login</h1>
                {error && <div className="error text-center">{error}</div>}

                <div className="form-group flex flex-col items-center mt-6">

                    <label htmlFor="email" id="input_email" className="font-bold">Usuario</label>
                    <InputUser value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="form-group flex flex-col items-center mb-4">
                    <label htmlFor="password" className="font-bold">Contraseña</label>
                    <InputPassword value={password} onChange={e => setPassword(e.target.value)} />
                </div>

                <div className="flex justify-center">
                    <MyButton type="submit">Ingresar</MyButton>

                </div>

            </form>
        </div>

    )
}


function InputUser({ value, onChange }) {
    return (
        <input
            type="text"
            id="email"
            name="email"
            value={value}
            onChange={onChange}
            required
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    )
}

function InputPassword({ value, onChange }) {
    return (
        <input
            type="password"
            id="password"
            name="password"
            value={value}
            onChange={onChange}
            required
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    )
}

function MyButton({ type = 'button', children }) {
    return (
        <button type={type} className="black-buttons bg-blue-500 transition delay-700 duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500">
            {children}
        </button>
    )
}

export default Login;

