import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';



import './styles/App.css';

function Login() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;


    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        const payload = JSON.stringify({ email, password });

        try {
            // 1. Generar clave AES aleatoria
            const sessionKey = await generateRandomKey();
            const rawSessionKey = await exportKeyRaw(sessionKey);

            // 2. Cifrar payload con esa clave
            const { ciphertext, iv } = await encrypt(payload, sessionKey);

            // 3. Enviar todo al backend: clave (raw), IV, payload
            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                credentials: 'include',
                body: JSON.stringify({
                    key: btoa(String.fromCharCode(...new Uint8Array(rawSessionKey))), // clave en base64
                    iv: Array.from(iv),
                    payload: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
                })
            });



            const data = await response.json();
            if (response.ok) {
                const user = data.user;
                const message = data.message;

                console.log('Usuario:', user);
                console.log('Mensaje:', message);

                alert(`${message}: ${user.name}`);
                localStorage.setItem('authToken', 'fake-token'); 
                navigate('/links');
            } else {
                const message = data.message;
                alert(`${message}`);
            }

        } catch (error) {
            console.error('Error al conectar con la API:', error);
            alert('Error al conectar con el servidor');
        }
    };



    async function generateRandomKey() {
        return crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    async function exportKeyRaw(key) {
        return await crypto.subtle.exportKey("raw", key); // devuelve ArrayBuffer
    }

    async function encrypt(plainText, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plainText);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const ciphertext = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            data
        );

        return { ciphertext, iv };
    }

    /*async function decrypt(base64Payload, ivArray, rawKey) {
        const key = await crypto.subtle.importKey(
            'raw',
            rawKey,
            'AES-GCM',
            false,
            ['decrypt']
        );

        const ciphertext = Uint8Array.from(atob(base64Payload), c => c.charCodeAt(0));
        const iv = new Uint8Array(ivArray);

        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }*/


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

