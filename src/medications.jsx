import { createRoot } from 'react-dom/client'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


import './styles/App.css';

function Medications() {
    const API_BASE = process.env.REACT_APP_API_BASE_URL;

    const [dni, setDni] = useState('')
    const [medication, setMedication] = useState('')
    const [amount, setAmount] = useState('')

    const [medication2, setMedication2] = useState('')
    const [amount2, setAmount2] = useState('')

    const [medication3, setMedication3] = useState('')
    const [amount3, setAmount3] = useState('')

    const [error, setError] = useState(null)
    const navigate = useNavigate();

    const [dniValid, setDniValid] = useState(false);
    const [dniError, setDniError] = useState(false);
    const [personName, setPersonName] = useState('');

    const [showMed2, setShowMed2] = useState(false);
    const [showMed3, setShowMed3] = useState(false);

    useEffect(() => {  //useEffect: hook que se ejecuta cada vez que cambian cualquiera de las variables del array final ([dni, API_BASE]).
        setDniError(null); //limpiamos las variables 
        setDniValid(false);
        setPersonName('');

        if (!dni) return;    //si dni es vacio, sale del flujo            
        if (dni.length < 6) {
            setDniError('El DNI debe tener al menos 6 dígitos.');
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`https://continuity-country-distinguished-seven.trycloudflare.com/api/buscarPersona`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ dni })
                });


                const data = await res.json();
                if (res.ok) {

                    setPersonName(`${data.nombre_p} ${data.apellido}`);
                    setDniValid(true);
                    setDniError(null);

                } else if (res.status === 404) {
                    setDniValid(false);
                    setDniError('Persona no encontrada');
                } else {
                    // otro error de servidor
                    setDniValid(false);
                    setDniError('Error validando DNI');
                }
            } catch (e) {
                setDniValid(false);
                setDniError('No se pudo contactar al servidor');
            }
        }, 500); // espera 500ms antes de lanzar la validacion

        return () => clearTimeout(timer);
    }, [dni]);



    const handleMedications = async (e) => {
        e.preventDefault();

        try {
            if (!dni || !medication || !amount) {
                alert("Por favor, completá todos los campos.");
                return;
            }

            const response = await fetch(`https://continuity-country-distinguished-seven.trycloudflare.com/api/medications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                credentials: 'include',
                body: JSON.stringify({ dni, medication, amount, medication2, amount2, medication3, amount3 })
            });

            const data = await response.json();

            if (response.ok) {

                alert('Solicitud creada con exito');
                navigate('/links');

                //console.log(data.user);
            } else {
                alert(data.message || 'Hubo problemas al crear la solicitud');
            }
        } catch (error) {
            console.error('Error al conectar con la API:', error);
            alert('Error al conectar con el servidor');
        }
    };


    const closeMed2 = () => {
        setShowMed2(false);
        setMedication2('');
        setAmount2('');
        // Si cierras Med2, también cerramos Med3 por dependencia
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
        <div
            className={`
                w-11/12            
                sm:w-3/4            
                md:w-full          
                max-w-lg            
                mx-auto
                shadow-[0_10px_40px_rgba(0,0,0,0.3)]
                rounded-3xl         
                overflow-hidden`}>
            <div
                className={`
                    bg-white
                    overflow-hidden
                    px-4 py-6           
                    sm:px-8 sm:py-8     
                    rounded-2xl         
                    sm:rounded-[2.5rem] 
                    w-full`
                }>

                <form className="w-full" onSubmit={handleMedications}>
                    <h1 className="text-xl font-bold text-center text-white-600 mb-4">Solicitud de Medicamentos</h1>
                    {error && <div className="error">{error}</div>}

                    <div className="form-group flex flex-col items-center mt-6 gap-4">


                        <div className="flex flex-col items-center">
                            <label htmlFor="dni" className="font-bold mb-1">DNI:</label>
                            <InputDni value={dni} onChange={e => setDni(e.target.value)} />
                            {dniError && (
                                <p className="text-red-500 text-sm mt-1">{dniError}</p>
                            )}
                            {dniValid && personName && (
                                <p className="text-green-600 text-sm mt-1">
                                    Persona encontrada: <strong>{personName}</strong>
                                </p>
                            )}
                        </div>


                        <div className="flex justify-center gap-x-0.5 -mt-2">

                            <div className="flex flex-col items-center">
                                <label htmlFor="input_medication" className="font-bold">Medicamento:</label>
                                <InputMedication value={medication} onChange={e => setMedication(e.target.value)} />
                            </div>

                            <div className="flex flex-col items-center">
                                <label htmlFor="amount" className="font-bold">Cantidad:</label>
                                <InputAmount value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMed2(true)}
                                disabled={showMed2}
                                className={`self-start mt-12 inline-flex items-center justify-center text-xs text-green-500 hover:text-green-700 p-0 m-0 h-5 w-5
                                ${showMed2 ? 'opacity-50 cursor-not-allowed hover:text-green-500' : 'hover:text-green-700'}`}

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
                                                onChange={e => setMedication2(e.target.value)}
                                            />
                                        </div>

                                        {/* Campo Cantidad 2 */}
                                        <div className="flex flex-col items-center">
                                            <InputAmount2
                                                value={amount2}
                                                onChange={e => setAmount2(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex flex-col items-center gap-1 mt-3.5 mr-0">
                                            <button
                                                type="button"
                                                onClick={closeMed2}
                                                disabled={showMed3}
                                                className={`inline-flex items-center h-5 w-5 justify-center text-xs leading-none text-red-500 p-0 m-0
                                                ${showMed3 ? 'opacity-50 cursor-not-allowed hover:text-red-500' : 'hover:text-red-700'}`}
                                                style={{ lineHeight: 1 }}
                                            >
                                                -
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setShowMed3(true)}
                                                disabled={showMed3}
                                                className={`inline-flex items-center h-5 w-5 justify-center text-xs leading-none text-red-500 p-0 m-0
                                                ${showMed3 ? 'opacity-50 cursor-not-allowed hover:text-red-500' : 'hover:text-red-700'} `}                                                                                            //si es true se bloquea el boton y sino se desbloquea
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

                                        <InputMedication3 value={medication3} onChange={e => setMedication3(e.target.value)} />
                                    </div>

                                    <div className="flex flex-col items-center">

                                        <InputAmount3 value={amount3} onChange={e => setAmount3(e.target.value)} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeMed3}
                                        className="self-start mt-6 inline-flex items-center justify-center text-xs text-red-500 hover:text-red-700 p-0 m-0 h-5 w-5">

                                        -
                                    </button>

                                </div>

                            </>
                        )}
                    </div>


                    <div className="flex justify-center gap-2 my-5">
                        <MyButton type="submit">Solicitar</MyButton>

                        <BackButton />

                    </div>

                </form>
            </div>
        </div>

    )
}


function InputDni({ value, onChange }) {
    return (
        <input
            type="number"
            id="dni"
            name="dni"
            value={value}
            onChange={onChange}
            required
            className="w-80 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    )
}
/*Medication 1*/
function InputMedication({ value, onChange }) {
    return (
        <input
            type="text"
            id="medication"
            name="medication"
            value={value}
            onChange={onChange}
            required
            className="w-50 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    )
}
function InputAmount({ value, onChange }) {
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
        />
    )
}

/*Medicacion 2*/
function InputMedication2({ value, onChange }) {
    return (
        <input
            type="text"
            id="medication2"
            name="medication2"
            value={value}
            onChange={onChange}
            className="w-50 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    )
}
function InputAmount2({ value, onChange }) {
    return (
        <input
            type="number"
            id="amount2"
            name="amount2"
            value={value}
            onChange={onChange}
            min={1}
            className="w-20 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    )
}

/*Medication 3*/
function InputMedication3({ value, onChange }) {
    return (
        <input
            type="text"
            id="medication3"
            name="medication3"
            value={value}
            onChange={onChange}
            className="w-50 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    )
}
function InputAmount3({ value, onChange }) {
    return (
        <input
            type="number"
            id="amount3"
            name="amount3"
            value={value}
            onChange={onChange}
            min={1}
            className="w-20 px-3 py-2 rounded-md border border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    )
}

function MyButton({ type = 'button', children }) {
    return (
        <button
            className="w-full max-w-[120px] sm:max-w-[160px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
            duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
        >


            {children}
        </button>
    )
}


function BackButton() {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/links')}
            className="w-full max-w-[120px] sm:max-w-[160px] px-2 py-2 bg-blue-500 rounded text-white text-sm transition delay-700 
            duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
        >
            Volver
        </button>
    );
}


export default Medications;

