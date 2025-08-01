import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Layout from './components/Layout';
import { useNavigate } from 'react-router-dom';
import { useSession } from './contexts/SessionContext';
import { encryptData, decryptData } from './cryptoUtils';
import { arrayBufferToBase64 } from './cryptoUtils';
import { refreshAccessToken } from './jwtUtils';

function MyRequests() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;
    const { sessionKey } = useSession();
    const { usuario } = useSession();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const { accessToken, updateAccessToken } = useSession();

    useEffect(() => {
        const fetchRequests = async () => {
            if (!usuario) return;

            setLoading(true);
            try {
                const payload = { dni_user: usuario.dni };

                const encrypted = await encryptData(payload, sessionKey);
                if (!encrypted) {
                    console.error('Error al encriptar los datos.');
                    return;
                }
                const rawKey = await crypto.subtle.exportKey('raw', sessionKey);
                const base64Key = arrayBufferToBase64(rawKey);
                const sendRequest = async (token) => {
                    return await fetch(`${API_BASE}/api/medicationsRequests`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                            'X-AES-Key': base64Key,
                        },
                        credentials: "include",
                        body: JSON.stringify({
                            ciphertext: encrypted.ciphertext,
                            iv: encrypted.iv
                        })
                    });
                };

                let response = await sendRequest(accessToken);

                // Si expira el token, intentá refrescarlo
                if (response.status === 401) {
                    const newToken = await refreshAccessToken(updateAccessToken);
                    if (newToken) {
                        response = await sendRequest(newToken); // Reintenta con el nuevo token
                    }
                }

                const data = await response.json();

                if (data.error) {
                    console.error('Error en la respuesta:', data.error);
                    return;
                }

                const decrypted = await decryptData(data, sessionKey);



                const parsedData = JSON.parse(decrypted);


                setRequests(parsedData);

            } catch (error) {
                console.error('Error al conectar con el servidor:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [usuario, sessionKey]);



    if (!usuario) {
        return <div className="text-center mt-10">Cargando sesión...</div>;
    }
    return (
        <Layout>
            {loading && (
                <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
                    <div className="flex items-center gap-3 bg-transparent px-4 py-2 rounded">
                        <div className="custom-spinner"></div>
                        <span className="font-semibold text-xl loading-text">
                            Procesando...
                        </span>
                    </div>
                </div>
            )}

            {!loading && (
                <div className="w-full mx-auto">
                    <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-4 hide-scrollbar mt-30">
                        <div className="flex flex-col items-center gap-2" style={{ minWidth: '350px' }}>
                            <MedicationButton to="/medications" updateAccessToken={updateAccessToken}>Cargar</MedicationButton>
                            {requests.length === 0 ? (
                                <p className="text-center text-gray-600 text-lg font-semibold mt-10">
                                    No tienes Solicitudes de Medicamentos.
                                </p>
                            ) : (
                                requests.map((req, index) => (
                                    <div
                                        key={index}
                                        className="w-full max-w-[2000px] bg-white shadow-md rounded-lg px-5 py-3 border border-gray-200"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-800">
                                                    Solicitud #{req.request.id}
                                                </h2>
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Estado: {req.request.estado}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Solicitado el {new Date(req.request.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-6 text-base text-gray-700">
                                            <div className="w-full sm:w-1/2">
                                                <p className="font-semibold">Solicitados:</p>
                                                <ul className="list-disc list-inside">
                                                    {req.items.map((item, i) => (
                                                        <p key={i}>
                                                            {item.medicamento} (x{item.cantidad_solicitada})
                                                        </p>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="w-full sm:w-1/2">
                                                <p className="font-semibold">Aprobados:</p>
                                                <ul className="list-disc list-inside">
                                                    {req.items.map((item, i) => (
                                                        <p key={i}>
                                                            {item.aprobado === 1
                                                                ? `✅ ${item.medicamento} (x${item.cantidad_aprobada})`
                                                                : '🕝'}
                                                        </p>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="flex justify-center mb-25">
                        <BackButton updateAccessToken={updateAccessToken} />
                    </div>
                </div>
            )}
        </Layout>
    );





}


function MedicationButton({ type = 'button', children, to, updateAccessToken }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
            refreshAccessToken(updateAccessToken);
        }
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            className="w-[160px] bg-blue-500 transition delay-700 duration-700 ease-in-out hover:-translate-y-[1px] hover:scale-99 hover:bg-indigo-500"
        >
            {children}
        </button>
    );
}
function BackButton({ disabled = false, updateAccessToken }) {
    const navigate = useNavigate();

    const handleClick = () => {
        // Forzar pérdida de foco
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        navigate('/links');
        refreshAccessToken(updateAccessToken);
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`mt-3 w-[160px] sm:max-w-[160px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
            duration-700 ease-in-out hover:-translate-y-1 hover:scale-101 hover:bg-indigo-500 
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            Volver
        </button>
    );
}


export default MyRequests;