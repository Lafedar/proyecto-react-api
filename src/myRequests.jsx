import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Layout from './components/Layout';
import { useNavigate } from 'react-router-dom';
import { useSession } from './contexts/SessionContext';
import { encryptData, decryptData } from './cryptoUtils';

function MyRequests() {
    const { sessionKey } = useSession();
    const { usuario } = useSession();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

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

                const response = await fetch(`https://demands-mag-lite-enjoying.trycloudflare.com/api/medicationsRequests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        ciphertext: encrypted.ciphertext,
                        iv: encrypted.iv
                    })
                });

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
            <div className="tabla-container overflow-x-auto">
                <div className="max-h-[80vh] overflow-y-auto">
                    <table className="tabla-solicitudes">
                        <thead className="sticky top-10 bg-[rgba(15,79,141,0.83)] text-white z-10">
                            <tr>
                                <th>Solicitante</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req, index) => (
                                <tr key={index}>
                                    <td>{req.request.dni_persona}</td>
                                    <td>{req.request.estado}</td>
                                    <td>{new Date(req.request.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <ul className="list-disc ml-4">
                                            {req.items.map((item, i) => (
                                                <li key={i}>
                                                    {item.medicamento} (x{item.cantidad})
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <BackButton to="/" />
        </Layout>
    );


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


export default MyRequests;


