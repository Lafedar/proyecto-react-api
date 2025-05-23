import { createRoot } from 'react-dom/client'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';


import './styles/App.css';

function Login() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;
    const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        const payload = JSON.stringify({ email, password });

        try {
            //Transforma la contraseña secreta en una clave binaria fuerte de 256 bits
            const keyMaterial = await getKeyMaterial(SECRET_KEY);
            const key = await getAesKey(keyMaterial);

            // Cifrar
            const { ciphertext, iv } = await encrypt(payload, key);

            // Enviar payload cifrado + IV al backend
            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                credentials: 'include',
                body: JSON.stringify({
                    payload: btoa(String.fromCharCode(...new Uint8Array(ciphertext))), // Base64
                    iv: Array.from(iv) // Array simple para facilitar el parseo
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                const decryptedUser = await decrypt(data.user.payload, data.user.iv, SECRET_KEY);
                localStorage.setItem('authToken', data.token);
                alert('Bienvenido/a: ' + decryptedUser.name);
                navigate('/links');
            } else {
                alert(data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Error al conectar con la API:', error);
            alert('Error al conectar con el servidor');
        }
    };


    async function getKeyMaterial(secret) { //	Importa clave RAW para derivar.
        const encoder = new TextEncoder();
        return crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
    }

    async function getAesKey(keyMaterial) { //Deriva clave AES para cifrado.
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new TextEncoder().encode('mi_salt_fijo'),
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async function encrypt(plainText, key) { //Cifra texto con AES-GCM.
        const encoder = new TextEncoder();
        const data = encoder.encode(plainText);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // IV aleatorio

        const ciphertext = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            data
        );

        return { ciphertext, iv };
    }
    async function getDerivedKey(password, salt = 'mi_salt_fijo') { //Deriva clave AES para descifrado.
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode(salt),
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );
    }
    async function decrypt(base64Payload, ivArray, password) {  //Descifra y parsea JSON del backend.
        const key = await getDerivedKey(password);

        const ciphertextWithTag = Uint8Array.from(atob(base64Payload), c => c.charCodeAt(0));
        const iv = new Uint8Array(ivArray);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            ciphertextWithTag
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted)); 
    }


    //Vista que voy a mostrar en el index.html
    return (

        <div>
            <form className="login-form" onSubmit={handleLogin}>
                <h1 className="text-x1 font-bold text-white-600">Login</h1>
                {error && <div className="error">{error}</div>}

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

