import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from './components/Toast';
import Layout from './components/Layout';
import './styles/App.css';
import { encryptData, decryptData } from './cryptoUtils';

function ResetPassword() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;
    const [dni, setDni] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aesKey, setAesKey] = useState(null);
    const [loadingToast, setLoadingToast] = useState(false);




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


            const importedKey = await crypto.subtle.importKey(

                'raw',

                keyBuffer,

                'AES-GCM',

                true,

                ['encrypt', 'decrypt']

            );
            setAesKey(importedKey);
        } catch (err) {
            console.error(err.message);
            setAesKey(null);

        }

    }

    useEffect(() => {
        fetchKey();
    }, []);




    async function resetPassword(event) {
        event.preventDefault();
        setError(null);
        setLoading(true);
        setLoadingToast(true);

        if (!aesKey) {
            throw new Error('No se pudo obtener la clave AES, no se puede encriptar');
        }
        if (password !== password2) {
            setToastMessage('Las contraseñas no coinciden.');
            setShowToast(true);
            setLoading(false);
            setLoadingToast(false);
            return;
        }

        try {
            const payload = { dni, password };

            const encrypted = await encryptData(payload, aesKey);
            if (!encrypted) {
                console.error('Error al encriptar los datos en medications.');
                return;
            }
            const response = await fetch(`${API_BASE}/api/resetPassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    ciphertext: encrypted.ciphertext,
                    iv: encrypted.iv
                })
            });


            const data = await response.json();
            setLoadingToast(false);
            if (response.ok) {
                setToastMessage(data.message);
                setShowToast(true);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                setToastMessage(data.error || data.message);
                setShowToast(true);
            }

        } catch (err) {
            console.error('Error:', err);
            setToastMessage('Error de red o del servidor.');
            setShowToast(true);
        } finally {
            setLoading(false);
            setLoadingToast(false);
        }
    }


    return (
        <>
            {loadingToast && (
                <div className="fixed bottom-15 left-1/2 transform -translate-x-1/2 bg-transparent px-4 py-2 rounded flex items-center gap-2 z-50">
                    <div className="custom-spinner"></div>
                    <span className="font-semibold text-lg loading-text">
                        Procesando...
                    </span>
                </div>
            )}
            <Layout>
                <div>
                    {showToast && (
                        <Toast
                            message={toastMessage}
                            onClose={() => setShowToast(false)}
                        />
                    )}

                    <form className="login-form" onSubmit={resetPassword}>

                        <h1 className="text-x1 font-bold text-white-600">Restablecer contraseña</h1>
                        {error && <div className="error">{error}</div>}

                        <div className="form-group flex flex-col items-center mt-6">

                            <label htmlFor="password" className="font-bold">Contraseña</label>
                            <InputPassword value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />

                            <label htmlFor="password2" className="font-bold">Repita su Contraseña</label>
                            <InputPassword2 value={password2} onChange={e => setPassword2(e.target.value)} disabled={loading} />

                        </div>

                        <div className="flex justify-center gap-2 my-5 mt-10 mb-1">
                            <BackButton disabled={loading} />
                            <MyButton type="submit" disabled={loading}>Restablecer contraseña</MyButton>

                        </div>



                    </form>
                </div>
            </Layout>



        </>
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

function InputPassword2({ value, onChange, disabled }) {
    return (
        <input
            type="password"
            id="password2"
            name="password2"
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
function BackButton({ disabled = false }) {
    const navigate = useNavigate();

    const handleClick = () => {
        // Forzar pérdida de foco
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        navigate('/');
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`w-full max-w-[120px] sm:max-w-[160px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
            duration-700 ease-in-out hover:-translate-y-1 hover:scale-101 hover:bg-indigo-500 
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            Volver
        </button>
    );
}

export default ResetPassword;

