import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';



import './styles/App.css';

function Login() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;


    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate();

    let aesKey = null;


    // Paso 1 - Obtener clave desde el backend (una vez por sesión)

    async function fetchKey() {
        try {
            const response = await fetch('https://c80c-181-30-186-149.ngrok-free.app/api/get-key', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            
            const base64Key = data.key.trim().replace(/\s+/g, '');
            const keyRaw = atob(base64Key); // Base64 → texto binario
            console.log('Clave recibida del backend:', JSON.stringify(data.key));

            const keyBuffer = new Uint8Array([...keyRaw].map(c => c.charCodeAt(0))); // Texto binario → bytes


            aesKey = await crypto.subtle.importKey(

                'raw',

                keyBuffer,

                'AES-GCM',

                false,

                ['encrypt', 'decrypt']

            );
            console.log('Clave importada correctamente:', aesKey);
        } catch (err) {
            console.error('Fetch failed:', err);
            aesKey = null;
        }

    }

    async function encryptAndSend(message) {
        if (!aesKey) {
            throw new Error('La clave AES no está cargada. Ejecutá fetchKey() primero.');
        }
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV de 12 bytes recomendado para AES-GCM

        const encodedMessage = new TextEncoder().encode(message);

        
        const ciphertextBuffer = await crypto.subtle.encrypt(

            {

                name: "AES-GCM",

                iv: iv

            },

            aesKey,

            encodedMessage

        );


        const ciphertext = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));

        const ivBase64 = btoa(String.fromCharCode(...iv));


        // Enviar al backend

        const response = await fetch('https://c80c-181-30-186-149.ngrok-free.app/api/decrypt', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json'

            },

            credentials: 'include', 

            body: JSON.stringify({

                ciphertext: ciphertext,

                iv: ivBase64

            })

        });


        // Leer respuesta cifrada del backend

        const data = await response.json();
        
        if (data.error) {
            console.error('Error del backend:', data.error);
            return; // No intentes desencriptar si hay error
        }
        const mensajeDesencriptado = await decryptResponseFromBackend(data);

        alert('Respuesta desencriptada del backend:', mensajeDesencriptado);

    }

    async function decryptResponseFromBackend(data) {
        console.log('Respuesta cifrada del backend:', data);

        const ciphertextWithTag = Uint8Array.from(atob(data.ciphertext), c => c.charCodeAt(0));

        const iv = Uint8Array.from(atob(data.iv), c => c.charCodeAt(0));


        const decryptedBuffer = await window.crypto.subtle.decrypt(

            {

                name: "AES-GCM",

                iv: iv

            },

            aesKey,

            ciphertextWithTag

        );


        return new TextDecoder().decode(decryptedBuffer);

    }



    async function iniciar(event) {
        event.preventDefault();
        await fetchKey(); // Solo una vez
        if (!aesKey) {
            console.error('No se pudo obtener la clave AES, no se puede encriptar');
            return;
        }
        await encryptAndSend('Hola backend, ¿cómo estás?');

    }

    //Vista que voy a mostrar en el index.html
    return (

        <div>
            <form className="login-form" onSubmit={iniciar}>
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

