import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './contexts/SessionContext';
import { arrayBufferToBase64 } from './cryptoUtils';
import Toast from './components/Toast';
import Layout from './components/Layout';
import './styles/App.css';
import { encryptData, decryptData } from './cryptoUtils';
import { useSearchParams } from 'react-router-dom';

function CreateUser() {
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
    const { updateSessionKey } = useSession();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const { sessionKey } = useSession();
    const [searchParams] = useSearchParams();
    const message = searchParams.get('message');
    const [aesKey, setAesKey] = useState(null);




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
            return;
        }
        if (dni.length !== 8) return;

        setDniError(null);
        setDniValid(false);
        setPersonName('');

        const fetchPerson = async () => {
            try {
                const encrypted = await encryptData({ dni }, aesKey);

                if (!encrypted) {
                    console.error("Falló la encriptación en medications");
                    return;
                }

                const res = await fetch(
                    `https://geology-optimum-soldiers-phone.trycloudflare.com/api/buscarPersona`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            ciphertext: encrypted.ciphertext,
                            iv: encrypted.iv,
                        }),
                    }
                );

                const data = await res.json();

                if (res.ok) {
                    const decrypted = await decryptData(data, aesKey);
                    const persona = JSON.parse(decrypted);
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



    async function crearUsuario(event) {
        event.preventDefault();
        setError(null);
        setLoading(true);

        if (!aesKey) {
            throw new Error('No se pudo obtener la clave AES, no se puede encriptar');
        }

        if (email !== email2 || password !== password2) {
            setToastMessage('Los emails o las contraseñas no coinciden.');
            setShowToast(true);
            setLoading(false);
            setLoadingToast(false);
            return;
        }



        try {
            const payload = { dni, email, password };

            const encrypted = await encryptData(payload, aesKey);
            if (!encrypted) {
                console.error('Error al encriptar los datos en medications.');
                return;
            }
            const response = await fetch('https://geology-optimum-soldiers-phone.trycloudflare.com/api/createUser', {
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
            {message ? <p>{message}</p> : null}
            <Layout>
                <div>
                    {showToast && (
                        <Toast
                            message={toastMessage}
                            onClose={() => setShowToast(false)}
                        />
                    )}

                    <form className="login-form" onSubmit={crearUsuario}>

                        <h1 className="text-x1 font-bold text-white-600">Registro de Usuario</h1>
                        {error && <div className="error">{error}</div>}

                        <div className="form-group flex flex-col items-center mt-6">

                            <label htmlFor="dni" id="input_dni" className="font-bold">Dni</label>
                            <InputDni value={dni} onChange={e => setDni(e.target.value)} disabled={loading} />
                            {dniError && (
                                <p className="text-red-500 text-sm mt-1">{dniError}</p>
                            )}
                            {dniValid && personName && (
                                <p className="text-green-600 text-sm mt-1">
                                    Persona encontrada: <strong>{personName}</strong>
                                </p>
                            )}
                            <label htmlFor="email" id="input_email" className="font-bold">Email</label>
                            <InputUser value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />

                            <label htmlFor="email2" id="input_email2" className="font-bold">Reingrese su email</label>
                            <InputUser2 value={email2} onChange={e => setEmail2(e.target.value)} disabled={loading} />
                        </div>

                        <div className="form-group flex flex-col items-center mb-4">
                            <label htmlFor="password" className="font-bold">Contraseña</label>
                            <InputPassword value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />


                            <label htmlFor="password2" className="font-bold">Reingrese su contraseña</label>
                            <InputPassword2 value={password2} onChange={e => setPassword2(e.target.value)} disabled={loading} />

                        </div>

                        <div className="flex justify-center gap-2 my-5 mt-10 mb-1">
                            <BackButton disabled={loading} />
                            <MyButton type="submit" disabled={loading}>Crear</MyButton>

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
function InputUser2({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="email2"
            name="email2"
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

        navigate('/links');
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

export default CreateUser;

