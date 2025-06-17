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

                const response = await fetch(`https://setup-influenced-numerical-copies.trycloudflare.com/api/medicationsRequests`, {
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
            <div className="w-full md:w-[95%] lg:w-[80%] mx-auto mt-1">
                <table className="w-full table-fixed border border-white rounded-md border-separate border-spacing-y-2">
                    <thead style={{ backgroundColor: 'rgba(15, 79, 141, 0.83)' }}>
                        <tr>
                            <th className="w-1/6 px-2 py-1 text-[10px] sm:text-xs md:text-sm
 text-center font-bold text-white">
                                Solicitante
                            </th>
                            <th className="w-1/6 px-2 py-1 text-[10px] sm:text-xs md:text-sm
 text-center font-bold text-white">
                                Estado
                            </th>
                            <th className="w-1/6 px-2 py-1 text-[10px] sm:text-xs md:text-sm
 text-center font-bold text-white">
                                Fecha
                            </th>
                            <th className="w-1/3 px-2 py-1 text-[10px] sm:text-xs md:text-sm
 text-center font-bold text-white">
                                Items Solicitados
                            </th>
                            <th className="w-1/3 px-2 py-1 text-[10px] sm:text-xs md:text-sm
 text-center font-bold text-white">
                                Items Aprobados
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req, index) => (
                            <tr key={index} className="bg-gray-100 rounded-md">
                                <td className="px-2 py-1 text-[9px] sm:text-xs md:text-sm text-center break-words text-blue-900">
                                    {usuario.nombre}
                                </td>
                                <td className="px-2 py-1 text-[9px] sm:text-xs md:text-sm text-center
 break-words text-blue-900">
                                    {req.request.estado}
                                </td>
                                <td className="px-2 py-1 text-[9px] sm:text-xs md:text-sm text-center
 break-words text-blue-900">
                                    {new Date(req.request.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-2 py-1 text-[9px] sm:text-xs md:text-sm text-center
 break-words text-blue-900">
                                    <ul className="list-disc ml-4">
                                        {req.items.map((item, i) => (
                                            <li key={i}>
                                                {item.medicamento} (x{item.cantidad_solicitada})
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-2 py-1 text-[9px] sm:text-xs md:text-sm text-center
 break-words text-blue-900">
                                    <ul className="list-disc ml-4">
                                        {req.items.map((item, i) => (
                                            <li key={i}>
                                                {item.aprobado === 1
                                                    ? `${item.medicamento} (x${item.cantidad_aprobada})`
                                                    : 'N/A'}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <BackButton to="/" />
            </div>


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
            className={`w-full mt-2 max-w-[120px] sm:max-w-[160px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
            duration-700 ease-in-out hover:-translate-y-1 hover:scale-101 hover:bg-indigo-500 
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            Volver
        </button>
    );
}


export default MyRequests;


