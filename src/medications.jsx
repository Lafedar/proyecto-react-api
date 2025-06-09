import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchKey, encryptData, decryptData, arrayBufferToBase64 } from './cryptoUtils';
import { useSession } from './contexts/SessionContext';
import Toast from './components/Toast';
import './styles/App.css';
import Layout from './components/Layout';


function Medications() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;

    const [dni, setDni] = useState('');
    const [medication, setMedication] = useState('');
    const [amount, setAmount] = useState('');
    const [medication2, setMedication2] = useState('');
    const [amount2, setAmount2] = useState('');
    const [medication3, setMedication3] = useState('');
    const [amount3, setAmount3] = useState('');

    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [dniValid, setDniValid] = useState(false);
    const [dniError, setDniError] = useState(false);
    const [personName, setPersonName] = useState('');

    const [showMed2, setShowMed2] = useState(false);
    const [showMed3, setShowMed3] = useState(false);
    const { sessionKey } = useSession();
    const { usuario } = useSession();

    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);


    /*useEffect(() => {
        if (dni.length !== 8 || !sessionKey) return;

        // Reinicio de estado
        setDniError(null);
        setDniValid(false);
        setPersonName('');

        const fetchPerson = async () => {
            try {
                const encrypted = await encryptData({ dni }, sessionKey);

                if (!encrypted) {
                    console.error("Falló la encriptación en medications");
                    return;
                }

                const res = await fetch(
                    `https://fees-lamps-exist-seat.trycloudflare.com/api/buscarPersona`,
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

                    const decrypted = await decryptData(data, sessionKey);
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
                setDniError('No se pudo contactar al servidor');
            }
        };

        fetchPerson();
    }, [dni, sessionKey]);*/
    if (!usuario) {
        return <div className="text-center mt-10">Cargando sesión...</div>;
    }

    const dni_user = usuario.dni;

    const handleMedications = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!medication || !amount) {
                setToastMessage(`Por favor, completá todos los campos.`);
                setShowToast(true);
                return;
            }

            const payload = { dni_user, medication, amount, medication2, amount2, medication3, amount3 };

            const encrypted = await encryptData(payload, sessionKey);
            if (!encrypted) {
                console.error('Error al encriptar los datos en medications.');
                return;
            }


            const response = await fetch(`https://fees-lamps-exist-seat.trycloudflare.com/api/medications`, {
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


            const isOk = response.ok;
            const status = response.status;
            const data = await response.json();


            if (isOk) {
                setToastMessage(data.message || 'Solicitud creada con éxito.');
                setShowToast(true);
                setTimeout(() => {
                    navigate("/links");
                }, 2000);

            } else {
                setToastMessage(data.message);
                setShowToast(true);
                setTimeout(() => {
                    setShowToast(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            console.error('Error al conectar con el servidor');
        }
        finally {
            setTimeout(() => {
                setLoading(false);
            }, 3000);
        }
    };

    const closeMed2 = () => {
        setShowMed2(false);
        setMedication2('');
        setAmount2('');
        setShowMed3(false);
        setMedication3('');
        setAmount3('');
    };
    const closeMed3 = () => {
        setShowMed3(false);
        setMedication3('');
        setAmount3('');
    };

    //Vista que voy a mostrar en el index.html
    return (
        <Layout>
            <div
                className={`
                mt-[-110px]       
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
                    <form className="w-full" onSubmit={handleMedications}>
                        <h1 className="text-xl font-bold text-center text-white-600 mb-4" id="titulo-solicitudes">Solicitud de Medicamentos</h1>
                        {error && <div className="error">{error}</div>}

                        <div className="form-group flex flex-col items-center mt-6 gap-4">


                            <div className="flex flex-col items-center">
                                <label className='font-bold mb-4'>Bienvenido, {usuario.nombre}</label>
                            </div>


                            <div className="flex justify-center gap-x-0.5 -mt-2">

                                <div className="flex flex-col items-center">
                                    <label htmlFor="input_medication" className="font-bold" id="label-medication">Medicamento:</label>
                                    <InputMedication value={medication} onChange={e => setMedication(e.target.value)} disabled={loading} />
                                </div>

                                <div className="flex flex-col items-center">
                                    <label htmlFor="amount" className="font-bold" id="label-amount">Cantidad:</label>
                                    <InputAmount value={amount} onChange={e => setAmount(e.target.value)} disabled={loading} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowMed2(true)}
                                    disabled={showMed2 || loading}

                                    className={`self-start mt-12 inline-flex items-center justify-center text-xs text-green-500 hover:text-green-700 p-0 m-0 h-5 w-5
                                ${(showMed2 || loading) ? 'opacity-50 cursor-not-allowed hover:text-green-500' : 'hover:text-green-700'}`}

                                >
                                    +
                                </button>


                            </div>

                            {showMed2 && (
                                <>
                                    {showMed2 && (
                                        <div className="flex justify-center gap-x-0.5 -mt-8">
                                            {/* Campo Medicamento 2 */}
                                            <div className="flex flex-col items-center">
                                                <InputMedication2
                                                    value={medication2}
                                                    onChange={e => setMedication2(e.target.value)} disabled={loading}
                                                />
                                            </div>

                                            {/* Campo Cantidad 2 */}
                                            <div className="flex flex-col items-center">
                                                <InputAmount2
                                                    value={amount2}
                                                    onChange={e => setAmount2(e.target.value)} disabled={loading}
                                                />
                                            </div>

                                            <div className="flex flex-col items-center gap-1 mt-3.5 mr-0">
                                                <button
                                                    type="button"
                                                    onClick={closeMed2}
                                                    disabled={showMed3 || loading}
                                                    className={`inline-flex items-center h-5 w-5 justify-center text-xs leading-none text-red-500 p-0 m-0
                                                ${(showMed3 || loading) ? 'opacity-50 cursor-not-allowed hover:text-red-500' : 'hover:text-red-700'}`}
                                                    style={{ lineHeight: 1 }}
                                                >
                                                    -
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowMed3(true)}
                                                    disabled={showMed3 || loading}
                                                    className={`inline-flex items-center h-5 w-5 justify-center text-xs leading-none text-red-500 p-0 m-0
                                                ${(showMed3 || loading) ? 'opacity-50 cursor-not-allowed hover:text-red-500' : 'hover:text-red-700'} `}                                                                                            //si es true se bloquea el boton y sino se desbloquea
                                                    style={{ lineHeight: 1 }}
                                                >
                                                    +
                                                </button>

                                            </div>

                                        </div>
                                    )}


                                </>
                            )}


                            {showMed3 && (
                                <>
                                    <div className="flex justify-center gap-x-0.5 -mt-8">

                                        <div className="flex flex-col items-center">

                                            <InputMedication3 value={medication3} onChange={e => setMedication3(e.target.value)} disabled={loading} />
                                        </div>

                                        <div className="flex flex-col items-center">

                                            <InputAmount3 value={amount3} onChange={e => setAmount3(e.target.value)} disabled={loading} />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={closeMed3}
                                            disabled={loading}
                                            className={`self-start mt-6 inline-flex items-center justify-center text-xs text-red-500 p-0 m-0 h-5 w-5
                                            ${loading ? 'opacity-50 cursor-not-allowed hover:text-red-500' : 'hover:text-red-700'}`}
                                        >
                                            -
                                        </button>


                                    </div>

                                </>
                            )}
                        </div>


                        <div className="flex justify-center gap-2 my-5 mt-10 mb-1">
                            <MyButton type="submit" disabled={loading} className={`btn ${loading ? 'opacity-100 cursor-not-allowed' : ''}`}> {loading ? 'Procesando...' : 'Solicitar'}</MyButton>

                            <BackButton disabled={loading} />

                        </div>

                    </form>
                </div>
            </div>
        </Layout>
    )
}



/*Medication 1*/
function InputMedication({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="medication"
            name="medication"
            value={value}
            onChange={onChange}
            required
            className="w-50 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
        />
    )
}
function InputAmount({ value, onChange, disabled }) {
    return (
        <input
            type="number"
            id="amount"
            name="amount"
            value={value}
            onChange={onChange}
            required
            min={1}
            className="w-20 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
        />
    )
}

/*Medicacion 2*/
function InputMedication2({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="medication2"
            name="medication2"
            value={value}
            onChange={onChange}
            className="w-50 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
        />
    )
}
function InputAmount2({ value, onChange, disabled }) {
    return (
        <input
            type="number"
            id="amount2"
            name="amount2"
            value={value}
            onChange={onChange}
            min={1}
            className="w-20 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
        />
    )
}

/*Medication 3*/
function InputMedication3({ value, onChange, disabled }) {
    return (
        <input
            type="text"
            id="medication3"
            name="medication3"
            value={value}
            onChange={onChange}
            className="w-50 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
        />
    )
}
function InputAmount3({ value, onChange, disabled }) {
    return (
        <input
            type="number"
            id="amount3"
            name="amount3"
            value={value}
            onChange={onChange}
            min={1}
            className="w-20 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
        />
    )
}
function MyButton({ children, disabled }) {
    return (
        <button
            disabled={disabled}
            className={`
                w-full max-w-[120px] sm:max-w-[160px] px-2 py-2 rounded text-white text-sm 
                ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:-translate-y-1 hover:scale-101 hover:bg-indigo-500'}
            `}
        >
            {children}
        </button>
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


export default Medications;

