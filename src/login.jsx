import { createRoot } from 'react-dom/client'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';


import './styles/App.css';

function Login() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate();

    const SECRET_KEY = 'clave_secreta_de_32_bytes_123456'; // debe coincidir con el backend
    const IV = 'vector_init_16byt'; // también debe coincidir

    const handleLogin = async (e) => {
        e.preventDefault();

        const payload = JSON.stringify({ email, password });

        // Encriptar con AES (CBC + PKCS7)
        const encrypted = CryptoJS.AES.encrypt(payload, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
            iv: CryptoJS.enc.Utf8.parse(IV),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        try {
            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                credentials: 'include',
                body: JSON.stringify({ payload: encrypted }) // <-- solo enviás esto
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                alert('Login exitoso');
                navigate('/links');
            } else {
                alert(data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Error al conectar con la API:', error);
            alert('Error al conectar con el servidor');
        }
    };


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

