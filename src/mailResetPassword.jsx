import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from './components/Toast';
import Layout from './components/Layout';
import './styles/App.css';
import { encryptData, decryptData } from './cryptoUtils';

function MailResetPassword() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;
    const [dni, setDni] = useState('')
    const [dniError, setDniError] = useState('')
    const [dniValid, setDniValid] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [email2, setEmail2] = useState('')
    const [password2, setPassword2] = useState('')
    const [personName, setPersonName] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aesKey, setAesKey] = useState(null);
    const [loadingToast, setLoadingToast] = useState(false);
    const [personActive, setPersonActive] = useState(false);
    const [search, setSearch] = useState(false);




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


    useEffect(() => {
        if (!aesKey) return;

        if (!dni) {

            setDniError(null);
            setDniValid(false);
            setPersonName('');
            setPersonActive(0);
            return;
        }
        if (dni.length !== 8) return;

        setDniError(null);
        setDniValid(false);
        setPersonName('');
        setPersonActive(0);

        const fetchPerson = async () => {
            try {
                setSearch(true);
                const encrypted = await encryptData({ dni }, aesKey);

                if (!encrypted) {
                    console.error("Falló la encriptación en buscar persona.");
                    return;
                }
                const rawKey = await crypto.subtle.exportKey('raw', aesKey);
                const base64Key = arrayBufferToBase64(rawKey);
                const res = await fetch(
                    `${API_BASE}/api/buscarPersona`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-AES-Key': base64Key,
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            ciphertext: encrypted.ciphertext,
                            iv: encrypted.iv,
                        }),
                    }
                );

                const data = await res.json();
                setSearch(false);
                if (res.ok) {
                    const decrypted = await decryptData(data, aesKey);
                    const persona = JSON.parse(decrypted);
                    setPersonActive(persona.activo);
                    setPersonName(`${persona.nombre_p} ${persona.apellido}`);
                    setDniValid(true);
                } else if (res.status === 404) {
                    setDniError('Persona no encontrada');
                } else {
                    setDniError('Error validando DNI');
                }
            } catch (e) {
                console.error(e);
                alert(e.message);
                setDniError('No se pudo contactar al servidor');
            }
        };

        fetchPerson();
    }, [dni, aesKey]);



    async function mailResetPassword(event) {
        event.preventDefault();
        setError(null);
        setLoading(true);
        setLoadingToast(true);

        if (!aesKey) {
            throw new Error('No se pudo obtener la clave AES, no se puede encriptar');
        }


        try {
            const payload = { dni, email };

            const encrypted = await encryptData(payload, aesKey);
            if (!encrypted) {
                console.error('Error al encriptar los datos en medications.');
                return;
            }
            const response = await fetch(`${API_BASE}/api/sendMailResetPassword`, {
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
                setTimeout(() => {
                    setShowToast(false);
                    navigate('/');
                }, 3000);
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

                    <form className="login-form" onSubmit={mailResetPassword}>

                        <h1 className="text-x1 font-bold text-white-600 text-center sm:text-left">Restablecer contraseña</h1>
                        {error && <div className="error">{error}</div>}

                        <div className="form-group flex flex-col items-center mt-6">

                            <label htmlFor="dni" id="input_dni" className="font-bold mb-[-15px]">Dni</label>
                            <InputDni value={dni} onChange={e => setDni(e.target.value)} disabled={loading} />

                            {search ? (
                                <p className="text-green-500 text-sm mt-[-5px]"><strong>Buscando...</strong></p>
                            ) : (
                                <>
                                    {dniError && (
                                        <p className="text-red-500 text-sm mt-1">{dniError}</p>
                                    )}

                                    {dniValid && personName && (
                                        personActive === 0 ? (
                                            <p className="text-red-500 text-sm mt-1">
                                                La persona no está activa en la empresa
                                            </p>
                                        ) : (
                                            <p className="text-green-600 text-sm mt-[-5px]">
                                                Hola: <strong>{personName}</strong>
                                            </p>
                                        )
                                    )}
                                </>
                            )}

                            <label htmlFor="email" id="input_email" className="font-bold mb-[-15px]">Email</label>
                            <InputUser value={email} onChange={e => setEmail(e.target.value)} disabled={loading || personActive === 0} />

                        </div>

                        <div className="flex justify-center gap-2 my-5 mt-10 mb-1">
                            <BackButton disabled={loading} />
                            <MyButton type="submit" disabled={loading || personActive !== 1}>Enviar mail</MyButton>

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
            className={`w-full max-w-[120px] sm:max-w-[135px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
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
            className={`w-full max-w-[120px] sm:max-w-[135px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
            duration-700 ease-in-out hover:-translate-y-1 hover:scale-101 hover:bg-indigo-500 
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            Volver
        </button>
    );
}

export default MailResetPassword;

