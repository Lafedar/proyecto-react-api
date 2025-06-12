import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './contexts/SessionContext';
import { arrayBufferToBase64 } from './cryptoUtils';
import Toast from './components/Toast';
import Layout from './components/Layout';
import './styles/App.css';

function Login() {
    //const API_BASE = process.env.REACT_APP_API_BASE_URL;
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const { updateSessionKey } = useSession();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const { updateUsuario } = useSession();
    const [loadingToast, setLoadingToast] = useState(false);

    let aesKey = null;
    async function fetchKey() {
        try {
            const response = await fetch(`https://knows-prisoner-pee-bow.trycloudflare.com/api/get-key`, {
                credentials: 'include',

            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();


            const base64Key = data.key.trim().replace(/\s+/g, '');
            const keyRaw = atob(base64Key); // Base64 → texto binario

            const keyBuffer = new Uint8Array([...keyRaw].map(c => c.charCodeAt(0))); // Texto binario → bytes


            aesKey = await crypto.subtle.importKey(

                'raw',

                keyBuffer,

                'AES-GCM',

                true,

                ['encrypt', 'decrypt']

            );
            updateSessionKey(aesKey); // Actualiza la clave en el contexto de sesión
        } catch (err) {
            console.error(err.message);
            aesKey = null;
            setAesKey(null);
        }

    }

    async function encryptLoginAndSend(email, password) {
        try {
            if (!aesKey) {
                console.error('La clave AES no está cargada.');
            }
            const loginPayload = JSON.stringify({
                usuario: email,
                password: password
            });
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encodedMessage = new TextEncoder().encode(loginPayload);

            const ciphertextBuffer = await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                aesKey,
                encodedMessage
            );

            const ciphertext = arrayBufferToBase64(ciphertextBuffer);
            const ivBase64 = arrayBufferToBase64(iv);

            const response = await fetch(`https://knows-prisoner-pee-bow.trycloudflare.com/api/login`, {
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


            const data = await response.json();
            if (data.error) {
                alert(data.error);
            }

            const mensajeDesencriptado = await decryptResponseFromBackend(data);
            return mensajeDesencriptado;
        }
        catch (err) {
            console.error("Error: " + err.message);
            throw err;
        }

    }


    async function decryptResponseFromBackend(data) {
        try {
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
        } catch (err) {
            console.error("Error al desencriptar la respuesta en el login:", err);
            throw err;
        }



    }



    async function iniciar(event) {
        event.preventDefault();
        setError(null);
        setLoading(true);
        setLoadingToast(true);
        try {
            await fetchKey();

            if (!aesKey) {
                throw new Error('No se pudo obtener la clave AES, no se puede encriptar');
            }

            const respuesta = await encryptLoginAndSend(email, password);


            const user = JSON.parse(respuesta);
            updateUsuario(user);
            setLoadingToast(false);

            if (user && user.email) {
                console.log(user);
                setToastMessage(`Bienvenido ${user.nombre}!`);
                setShowToast(true);
                setTimeout(() => {
                    sessionStorage.setItem('authToken', 'logged_in');
                    navigate("/links");
                }, 2000);
            } else {

                setToastMessage(user.error);
                setShowToast(true);
                setTimeout(() => {
                    setShowToast(false);
                }, 2000);
            }


        } catch (err) {
            console.error("Error en login: " + err.message);
        }
        finally {
            setLoading(false);
        }
    }


    //Vista que voy a mostrar en el index.html
    return (
        <>
            {loadingToast && (
                <>
                    <style>{`
      @keyframes loading {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      .custom-spinner {
        border: 6px dotted rgba(15, 79, 141, 0.83);
        border-radius: 100%;
        width: 30px;
        height: 30px;
        animation: loading 2s infinite linear;
      }
    `}</style>

                    <div className="fixed bottom-15 left-1/2 transform -translate-x-1/2 bg-transparent px-4 py-2 rounded flex items-center gap-2 z-50">
                        <div className="custom-spinner"></div>
                        <span
                            className="font-semibold text-lg"
                            style={{ color: "rgba(15, 79, 141, 0.83)" }}
                        >
                            Procesando...
                        </span>
                    </div>
                </>
            )}



            <Layout>
                <div id="login-container">
                    {showToast && (
                        <Toast
                            message={toastMessage}
                            onClose={() => setShowToast(false)}
                        />
                    )}

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
                            <MyButton type="submit" disabled={loading}>Ingresar</MyButton>

                        </div>

                    </form>
                </div>
            </Layout>



        </>
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

function MyButton({ type = 'button', children, disabled = false }) {
    return (
        <button type={type} disabled={disabled}
            className={`w-full max-w-[120px] sm:max-w-[160px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
            duration-700 ease-in-out hover:-translate-y-1 hover:scale-101 hover:bg-indigo-500 
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>

            {children}
        </button>
    )
}

export default Login;

