import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client'
import './styles/App.css';
import { useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { refreshAccessToken } from './jwtUtils';
import { useSession } from './contexts/SessionContext';
import Toast from './components/Toast';
import { encryptData, decryptData } from './cryptoUtils';
import { arrayBufferToBase64 } from './cryptoUtils';




function UpdateDataUser() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;
    const [dni, setDni] = useState('')
    const [dniError, setDniError] = useState('')
    const [dniValid, setDniValid] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [email2, setEmail2] = useState('')
    const [password2, setPassword2] = useState('')
    const [personName, setPersonName] = useState('')
    const [personActive, setPersonActive] = useState(false);
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aesKey, setAesKey] = useState(null);
    const [loadingToast, setLoadingToast] = useState(false);
    const [search, setSearch] = useState(false);
    const [showEmailSuggestion, setShowEmailSuggestion] = useState(false);
    const [emailCorp, setEmailCorp] = useState('')
    const { usuario } = useSession();
    const [secondaryEmail, setSecondaryEmail] = useState('');
    const [secondaryEmail2, setSecondaryEmail2] = useState('');


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
        if (usuario) {
            const esCorporativo = usuario.email?.endsWith('@lafedar.com');
            setShowEmailSuggestion(esCorporativo);

            if (esCorporativo) {
                // Modo sugerido con email corporativo
                setEmail(usuario.email_secundario || '');
                setEmail2(usuario.email_secundario || '');
                setEmailCorp(usuario.email || '');
            } else {
                // Modo editable con 4 campos
                setEmail(usuario.email || '');
                setEmail2(usuario.email || '');
                setSecondaryEmail(usuario.email_secundario || '');
                setSecondaryEmail2(usuario.email_secundario || '');
            }

            setDni(usuario.dni || '');
        }
    }, [usuario]);




    async function actualizarUsuario(event) {
        event.preventDefault();
        setError(null);
        setLoading(true);
        setLoadingToast(true);

        if (!aesKey) {
            throw new Error('No se pudo obtener la clave AES, no se puede encriptar');
        }

        if (showEmailSuggestion) {
            // Caso con email corporativo

            if (email !== email2) {
                setToastMessage('Los emails personales no coinciden.');
                setShowToast(true);
                setLoading(false);
                setLoadingToast(false);
                setTimeout(() => setShowToast(false), 3000);
                return;
            }

            if (email === emailCorp) {
                setToastMessage('El email personal no puede ser igual al corporativo.');
                setShowToast(true);
                setLoading(false);
                setLoadingToast(false);
                setTimeout(() => setShowToast(false), 3000);
                return;
            }

        } else {
            // Caso sin email corporativo

            if (email !== email2) {
                setToastMessage('Los emails principales no coinciden.');
                setShowToast(true);
                setLoading(false);
                setLoadingToast(false);
                setTimeout(() => setShowToast(false), 3000);
                return;
            }

            if (secondaryEmail !== secondaryEmail2) {
                setToastMessage('Los emails secundarios no coinciden.');
                setShowToast(true);
                setLoading(false);
                setLoadingToast(false);
                setTimeout(() => setShowToast(false), 3000);
                return;
            }

            if (email === secondaryEmail) {
                setToastMessage('El email secundario no puede ser igual al principal.');
                setShowToast(true);
                setLoading(false);
                setLoadingToast(false);
                setTimeout(() => setShowToast(false), 3000);
                return;
            }
        }

        try {
            let payload;

            if (showEmailSuggestion) {
                payload = {
                    dni,
                    emailCorp: emailCorp,
                    emailPersonal: email,

                };
            } else {
                payload = {
                    dni,
                    emailPerso: email,
                    email_secundario: secondaryEmail,
                };
            }

            const encrypted = await encryptData(payload, aesKey);
            if (!encrypted) {
                console.error('Error al encriptar los datos.');
                return;
            }
            const rawKey = await crypto.subtle.exportKey('raw', aesKey);
            const base64Key = arrayBufferToBase64(rawKey);
            const response = await fetch(`${API_BASE}/api/updateMailsUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-AES-Key': base64Key
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
            <div className="scroll-wrapper">
                {loadingToast && (
                    <div className="fixed bottom-15 left-1/2 transform -translate-x-1/2 bg-transparent px-4 py-2 rounded flex items-center gap-2 z-50">
                        <div className="custom-spinner"></div>
                        <span className="font-semibold text-lg loading-text">Procesando...</span>
                    </div>
                )}

                <Layout>
                    <div className="mb-5">
                        {showToast && (
                            <Toast message={toastMessage} onClose={() => setShowToast(false)} />
                        )}

                        <form className="login-form" onSubmit={actualizarUsuario}>
                            <h1 className="text-x1 font-bold text-white-600 text-center sm:text-left">
                                Actualizá tus datos
                            </h1>

                            {error && <div className="error">{error}</div>}

                            <div className="form-group flex flex-col items-center mt-3">
                                {showEmailSuggestion ? (
                                    <>
                                        {/* Email corporativo fijo + email personal */}
                                        <label htmlFor="suggestedEmail" className="font-bold mb-[-15px]">Email Corporativo</label>
                                        <InputSuggestedEmail
                                            value={emailCorp}
                                            onChange={e => setEmailCorp(e.target.value)}
                                            disabled={true}
                                        />

                                        <label htmlFor="email" className="font-bold mb-[-15px]">Email Personal</label>
                                        <InputUser value={email} onChange={e => setEmail(e.target.value)} disabled={loading || personActive === 0} />

                                        <label htmlFor="email2" className="font-bold mb-[-15px]">Reingrese su email personal</label>
                                        <InputUser2 value={email2} onChange={e => setEmail2(e.target.value)} disabled={loading || personActive === 0} />
                                    </>
                                ) : (
                                    <>
                                        {/* Email principal */}
                                        <label htmlFor="email" className="font-bold mb-[-15px]">Email Principal</label>
                                        <InputUser value={email} onChange={e => setEmail(e.target.value)} disabled={loading || personActive === 0} />

                                        <label htmlFor="email2" className="font-bold mb-[-15px]">Reingrese su email principal</label>
                                        <InputUser2 value={email2} onChange={e => setEmail2(e.target.value)} disabled={loading || personActive === 0} />

                                        {/* Email secundario */}
                                        <label htmlFor="secondaryEmail" className="font-bold mb-[-15px]">Email Secundario</label>
                                        <InputUser3
                                            value={secondaryEmail}
                                            onChange={e => setSecondaryEmail(e.target.value)}
                                            disabled={loading || personActive === 0}
                                        />

                                        <label htmlFor="secondaryEmail2" className="font-bold mb-[-15px]">Reingrese su email secundario</label>
                                        <InputUser4
                                            value={secondaryEmail2}
                                            onChange={e => setSecondaryEmail2(e.target.value)}
                                            disabled={loading || personActive === 0}
                                        />

                                    </>
                                )}
                            </div>



                            <div className="flex justify-center gap-2 my-5 mt-7 mb-5">
                                <BackButton disabled={loading} />
                                <MyButton type="submit">Actualizar</MyButton>
                            </div>
                        </form>
                    </div>
                </Layout>
            </div>


        </>
    );



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
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="username"
        />
    )
}
function InputUser2({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="email2"
            name="email2"
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="username"
        />
    )
}
function InputUser3({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="secondaryEmail"
            name="secondaryEmail"
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={false}
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="email"
        />
    );
}

function InputUser4({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="secondaryEmail2"
            name="secondaryEmail2"
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={false}
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="email"
        />
    );
}


function MyButton({ type = 'button', children, disabled = false }) {
    return (
        <button type={type} disabled={disabled}
            className={`w-full max-w-[140alapx] sm:max-w-[140px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
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

        navigate('/links');
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={`w-full max-w-[140px] sm:max-w-[140px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
                duration-700 ease-in-out hover:-translate-y-1 hover:scale-101 hover:bg-indigo-500 
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            Volver
        </button>
    );
}
function InputSuggestedEmail({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="suggestedEmail"
            name="suggestedEmail"
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-70 px-3 py-2 rounded-md border border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Correo sugerido"
        />
    );
}



export default UpdateDataUser;