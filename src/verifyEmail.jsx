import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './contexts/SessionContext';
import { arrayBufferToBase64 } from './cryptoUtils';
import Toast from './components/Toast';
import Layout from './components/Layout';
import './styles/App.css';
import { encryptData } from './cryptoUtils';
import { useSearchParams } from 'react-router-dom';

function VerifyEmail() {
    const [dni, setDni] = useState('')
    const [email, setEmail] = useState('')
    const [error, setError] = useState(null)
    const { updateSessionKey } = useSession();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
   


    useEffect(() => {
        const ciphertextB64 = searchParams.get('ciphertext');
        const ivB64 = searchParams.get('iv');
        const keyB64 = searchParams.get('key');
        if (ciphertextB64 && ivB64 && keyB64) {
            decryptData(ciphertextB64, ivB64, keyB64);
        }
    }, [searchParams]);


    async function decryptData(ciphertextB64, ivB64, keyB64) {
        try {
            const keyBytes = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
            const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
            const ciphertextWithTag = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));

            const key = await crypto.subtle.importKey(
                'raw',
                keyBytes,
                'AES-GCM',
                true,
                ['decrypt']
            );

            const tagLength = 16;
            const ciphertext = ciphertextWithTag.slice(0, -tagLength);
            const tag = ciphertextWithTag.slice(-tagLength);
            const fullCiphertext = new Uint8Array([...ciphertext, ...tag]);

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                fullCiphertext
            );

            const decodedText = new TextDecoder().decode(decrypted);
            const data = JSON.parse(decodedText);

            setDni(data.dni);
            setEmail(data.email);

        } catch (err) {
            console.error('Error al descifrar:', err);
            setToastMessage('No se pudieron descifrar los datos');
            setShowToast(true);
        }
    }


    let aesKey = null;
    async function fetchKey() {
        try {
            const response = await fetch(`https://geology-optimum-soldiers-phone.trycloudflare.com/api/get-key`, {
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
            updateSessionKey(aesKey); 
        } catch (err) {
            console.error(err.message);
            aesKey = null;
            setAesKey(null);
        }

    }


    async function reenviarMailVerificacion() {
        try {
            event.preventDefault();
            setError(null);
            setLoading(true);


            await fetchKey();
            if (!aesKey) {
                setToastMessage('No se pudo obtener la clave para encriptar');
                setShowToast(true);
                setLoading(false);

                return;
            }

            const payload = { dni, email };

            // Encriptar datos
            const encrypted = await encryptData(payload, aesKey);
            if (!encrypted) {
                setToastMessage('Error al encriptar los datos.');
                setShowToast(true);
                setLoading(false);

                return;
            }

            const response = await fetch('https://geology-optimum-soldiers-phone.trycloudflare.com/api/generateNewVerificationEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ciphertext: encrypted.ciphertext,
                    iv: encrypted.iv,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setToastMessage(data.message || 'Mail reenviado correctamente');
                setShowToast(true);
            } else {
                setToastMessage(data.message || 'Error al reenviar mail');
                setShowToast(true);
            }
        } catch (error) {
            console.error(error);
            setToastMessage('Error de red o del servidor.');
            setShowToast(true);
        } finally {
            setLoading(false);

        }
    }



    return (
        <>
            <Layout>
                <div>
                    {showToast && (
                        <Toast
                            message={toastMessage}
                            onClose={() => setShowToast(false)}
                        />
                    )}

                    <form className="login-form" onSubmit={reenviarMailVerificacion}>

                        <h1 className="text-x1 font-bold text-white-600">Verificar Email</h1>
                        {error && <div className="error">{error}</div>}

                        <div className="form-group flex flex-col items-center mt-6">

                            <label htmlFor="dni" id="input_dni" className="font-bold">Dni</label>
                            <InputDni value={dni} onChange={e => setDni(e.target.value)} disabled={loading} />

                            <label htmlFor="email" id="input_email" className="font-bold">Email</label>
                            <InputUser value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />

                        </div>

                        <div className="flex justify-center gap-2 my-5 mt-10 mb-1">
                            <BackButton disabled={loading} />
                            <MyButton type="submit" disabled={loading}>Enviar Mail de Verificación</MyButton>

                        </div>



                    </form>
                </div>
            </Layout>



        </>
    )

}
function InputDni({ value, onChange, disabled }) {
    return (
        <input
            type="number"
            id="dni"
            name="dni"
            value={value}
            onChange={onChange}
            disabled={disabled}
            required
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"

        />
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

export default VerifyEmail;

