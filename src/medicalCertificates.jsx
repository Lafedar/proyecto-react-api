import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './contexts/SessionContext';
import Toast from './components/Toast';
import Layout from './components/Layout';
import './styles/App.css';
import { useSearchParams } from 'react-router-dom';
import { encryptData, encryptFile } from './cryptoUtils';
import { refreshAccessToken } from './jwtUtils';
import { arrayBufferToBase64 } from './cryptoUtils';




function MedicalCertificates() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const { updateSessionKey } = useSession();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const { updateUsuario } = useSession();
    const [searchParams] = useSearchParams();
    const [loadingToast, setLoadingToast] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const { usuario } = useSession();
    const [selectedFile, setSelectedFile] = useState(null);
    const { sessionKey } = useSession();
    const { accessToken, updateAccessToken } = useSession();

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const allowedExtensions = ['pdf', 'jpg', 'jpeg'];
        const allowedMimeTypes = ['application/pdf', 'image/jpeg'];
        const maxSizeInMB = 10;
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

        const extension = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.type)) {
            setToastMessage("Solo se permiten archivos PDF o imágenes JPG/JPEG.");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            e.target.value = null;
            return;
        }

        if (file.size > maxSizeInBytes) {
            setToastMessage(`El archivo no puede superar los ${maxSizeInMB} MB.`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            e.target.value = null;
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoadingToast(true);

        if (!selectedFile || !title) {
            alert("Completá todos los campos");
            return;
        }

        const user_dni = usuario.dni || searchParams.get("dni");
        const campos = { title, description, user_dni };

        // Encriptar datos JSON
        const encryptedDatos = await encryptData(campos, sessionKey);
        if (!encryptedDatos) {
            console.error("Error al encriptar los datos.");
            return;
        }

        // Encriptar archivo
        const encryptedArchivo = await encryptFile(selectedFile, sessionKey);
        if (!encryptedArchivo) {
            console.error("Error al encriptar el archivo.");
            return;
        }

        // Enviar todo en JSON
        const payload = {
            datos: encryptedDatos,
            archivo: encryptedArchivo,
        };



        try {
            const rawKey = await crypto.subtle.exportKey('raw', sessionKey);
            const base64Key = arrayBufferToBase64(rawKey);
            const sendRequest = async (token) => {
                return await fetch(`${API_BASE}/api/medicalCertificate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                        'X-AES-Key': base64Key,
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
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
           
            setLoadingToast(false);
            if (response.ok) {
                setToastMessage(data.message);
                setShowToast(true);
                setTimeout(() => {
                    navigate("/links");
                    refreshAccessToken(updateAccessToken);
                }, 3000);
                setTitle("");
                setDescription("");
                setSelectedFile(null);
            } else {
                setToastMessage(data.message);
                setShowToast(true);
                setTimeout(() => {
                    navigate("/links");
                    refreshAccessToken(updateAccessToken);
                }, 3000);
                setTitle("");
                setDescription("");
                setSelectedFile(null);
            }
        } catch (error) {
            console.error('Error al guardar el certificado médico:', error);

        }
        finally {
            setTimeout(() => {
                setLoading(false);
            }, 3000);
        }
    };



    //Vista que voy a mostrar en el index.html
    return (
        <>
            {loadingToast && (
                <div className="fixed bottom-25 left-1/2 transform -translate-x-1/2 bg-transparent px-4 py-2 rounded flex items-center gap-2 z-50">
                    <div className="custom-spinner"></div>
                    <span className="font-semibold text-lg loading-text">
                        Procesando...
                    </span>
                </div>
            )}

            <Layout>
                <div
                    className={`
                    mt-[-30px]       
                    sm:mt-10         
                    w-11/12            
                    sm:w-3/4            
                    md:w-full          
                    max-w-lg            
                    mx-auto
                    shadow-[0_10px_40px_rgba(0,0,0,0.3)]
                    rounded-3xl         
                    `}>
                    <div
                        className={`
                        bg-white
                        px-4 py-6           
                        sm:px-8 sm:py-8     
                        rounded-2xl         
                        sm:rounded-[2.5rem] 
                        w-full`
                        } id="medications-container">
                        {showToast && (
                            <Toast
                                message={toastMessage}
                                onClose={() => setShowToast(false)}
                            />
                        )}
                        <form className="w-full" onSubmit={handleSubmit}>
                            <h1 className="text-xl font-bold text-center text-white-600 mb-4" id="titulo-solicitudes">Certificado Médico</h1>
                            {error && <div className="error">{error}</div>}

                            <div className="form-group flex flex-col items-center mt-6 gap-4">


                                <div className="flex justify-center gap-x-0.5 -mt-2">

                                    <div className="flex flex-col items-center">
                                        <label htmlFor="input_title" className="font-bold" id="label-title">Título:</label>
                                        <InputTitle value={title} onChange={e => setTitle(e.target.value)} disabled={loading} required />

                                        <label htmlFor="input_description" className="font-bold mt-[-5px]" id="label-description">Observación (opcional):</label>
                                        <InputDescription value={description} onChange={e => setDescription(e.target.value)} disabled={loading} />

                                        <label htmlFor="archivo" className="font-bold mt-[-5px]" id="label-archivo">Archivo (.jpg, .jpeg o .pdf):</label>
                                        <input
                                            type="file"
                                            id="archivo"
                                            name="archivo"
                                            accept=".jpg,.jpeg,.pdf"
                                            onChange={handleFileChange}
                                            disabled={loading}
                                            required
                                            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />


                                    </div>

                                </div>



                            </div>
                            <div className="flex justify-center gap-2 my-5 mt-5 mb-1">
                                <BackButton disabled={loading} updateAccessToken={updateAccessToken} />
                                <MyButton type="submit" disabled={loading}>Cargar</MyButton>



                            </div>

                        </form>
                    </div>
                </div>
            </Layout>
        </>

    )

}


function InputTitle({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="title"
            name="title"
            value={value}
            onChange={onChange}
            disabled={disabled}
            required
            className="w-70 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            minLength="8" maxLength="99"

        />
    )
}
function InputDescription({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="description"
            name="description"
            value={value}
            onChange={onChange}
            disabled={disabled}
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
            className={`w-full max-w-[120px] sm:max-w-[160px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
            duration-700 ease-in-out hover:-translate-y-1 hover:scale-101 hover:bg-indigo-500 
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            Volver
        </button>
    );
}

export default MedicalCertificates;

