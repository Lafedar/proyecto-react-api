import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './contexts/SessionContext';
import { arrayBufferToBase64 } from './cryptoUtils';
import { refreshAccessToken } from './jwtUtils';
import Toast from './components/Toast';
import Layout from './components/Layout';
import './styles/App.css';
import { useSearchParams } from 'react-router-dom';




function Login() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const { updateSessionKey } = useSession();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const { updateUsuario } = useSession();
    const [searchParams] = useSearchParams();
    const [loadingToast, setLoadingToast] = useState(false);
    const { accessToken, updateAccessToken } = useSession();
    const { sessionKey } = useSession();  //probar esto


    useEffect(() => {
        const message = searchParams.get('message');
        let timer;
        if (message === 'success') {
            setToastMessage('Tu usuario fue creado correctamente y el mail está verificado.!');
            setShowToast(true);
            timer = setTimeout(() => setShowToast(false), 3000);
        } else if (message === 'token') {
            setToastMessage('Su mail ya fue verificado anteriormente.');
            setShowToast(true);
            timer = setTimeout(() => setShowToast(false), 3000);
        } else if (message === 'expired') {
            setToastMessage('El token ha expirado. Por favor, solicite un nuevo enlace de verificación.');
            setShowToast(true);
            timer = setTimeout(() => setShowToast(false), 3000);
        } else if (message === 'error') {
            setToastMessage('La validación no se pudo completar. Por favor reintente crear el usuario.');
            setShowToast(true);
            timer = setTimeout(() => setShowToast(false), 3000);
        }

        return () => clearTimeout(timer);
    }, [searchParams]);



    let aesKey = null;
    async function fetchKey() {
        try {

            const response = await fetch(`${API_BASE}/api/get-key`, {
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

        }

    }



    async function encryptLoginAndSend(email, password) {
        try {
            if (!aesKey) {
                console.error('La clave AES no está cargada.');
                throw new Error('Clave AES faltante');
            }
            const loginPayload = JSON.stringify({ usuario: email, password: password });
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encodedMessage = new TextEncoder().encode(loginPayload);
            const ciphertextBuffer = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                aesKey,
                encodedMessage
            );
            const ciphertext = arrayBufferToBase64(ciphertextBuffer);
            const ivBase64 = arrayBufferToBase64(iv);
            // 🔐 Exportar clave AES a Base64URL
            const rawKey = await crypto.subtle.exportKey('raw', aesKey);
            const base64Key = arrayBufferToBase64(rawKey);
            const response = await fetch(`${API_BASE}/api/loginApi`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-AES-Key': base64Key, 
                },
                credentials: 'include',
                body: JSON.stringify({
                    ciphertext: ciphertext,
                    iv: ivBase64
                })
            });



            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en login:', errorText);
                return;
            }
            const data = await response.json();

            if (data.error) {
                alert(data.error);
                return;
            }

            // 🔓 Desencriptar respuesta
            const mensajeDesencriptado = await decryptResponseFromBackend(data);
            const usuarioData = JSON.parse(mensajeDesencriptado);
            if (usuarioData.token) {
                console.log("Token de acceso:", usuarioData.token);
                updateAccessToken(usuarioData.token);

            }

            return mensajeDesencriptado;
        } catch (err) {
            console.error("Error: " + err.message);
            throw err;
        }
    }

    function base64ToBase64URL(base64) {
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
                setToastMessage(`Bienvenido ${user.nombre}!`);
                setShowToast(true);

                setInterval(() => {
                    refreshAccessToken(updateAccessToken);
                }, 25 * 60 * 1000);

                setTimeout(() => {
                    sessionStorage.setItem('authToken', 'logged_in');
                    navigate("/links");
                    refreshAccessToken(updateAccessToken);
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
                <div className="fixed bottom-25 left-1/2 transform -translate-x-1/2 bg-transparent px-4 py-2 rounded flex items-center gap-2 z-50 spinner-wrapper">
                    <div className="custom-spinner"></div>
                    <span className="font-semibold text-lg loading-text">
                        Procesando...
                    </span>
                </div>
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

                            <label htmlFor="email" id="input_email" className="font-bold">Email</label>
                            <InputUser value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                        </div>

                        <div className="form-group flex flex-col items-center mb-4">
                            <label htmlFor="password" className="font-bold">Contraseña</label>
                            <InputPassword value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                            <ResetPasswordLink
                                to="/mailResetPassword" disabled={loading}
                                onClick={e => loading && e.preventDefault()}>
                                ¿Olvidaste tu contraseña?
                            </ResetPasswordLink>

                        </div>

                        <div className="flex flex-col items-center">
                            <MyButton type="submit" disabled={loading}>Ingresar</MyButton>
                            <CreateUserLink to="/createUser" disabled={loading}>¿No tienes cuenta? <b>Registrate</b></CreateUserLink>
                        </div>



                    </form>
                </div>
            </Layout>



        </>
    )

}


function InputUser({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="email"
            name="email"
            value={value}
            onChange={onChange}
            disabled={disabled}
            required
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="username"
        />
    )
}

function InputPassword({ value, onChange, disabled }) {
    return (
        <input
            type="password"
            id="password"
            name="password"
            value={value}
            onChange={onChange}
            disabled={disabled}
            required
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="current-password"
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

function CreateUserLink({ children, to, disabled = false }) {
    const navigate = useNavigate();

    const handleClick = (e) => {
        e.preventDefault();
        if (!disabled && to) {
            navigate(to);
        }
    };

    return (
        <a
            href={disabled ? undefined : to}
            onClick={handleClick}
            className={`mt-2 ${disabled ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''}`}
            style={{ color: 'rgba(15, 79, 141, 0.83)' }}
            aria-disabled={disabled}
        >
            {children}
        </a>
    );
}

function ResetPasswordLink({ children, to, disabled = false }) {
    const navigate = useNavigate();

    const handleClick = (e) => {
        e.preventDefault();
        if (!disabled && to) {
            navigate(to);
        }
    };

    return (
        <a
            href={disabled ? undefined : to}
            onClick={handleClick}
            className={`mt-[-10px] ${disabled ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''}`}
            style={{ color: 'rgba(15, 79, 141, 0.83)' }}
            aria-disabled={disabled}
        >
            {children}
        </a>
    );
}


export default Login;

