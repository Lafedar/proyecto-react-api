import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/App.css';
import { useNavigate } from 'react-router-dom';
import Layout from './components/Layout';

function Links() {
    return (
        <Layout>
            <div id="links-container">
                <h1>Links</h1>

                <MedicationButton to="/medications">Solicitudes de Medicamentos</MedicationButton>
                <MyRequestsButton to="/myRequests">Mis Solicitudes de Medicamentos</MyRequestsButton>
                <ExitButton to="/">Salir</ExitButton>
            </div>

        </Layout>

    )


}

function MedicationButton({ type = 'button', children, to }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        }
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            className="w-[300px] bg-blue-500 transition delay-700 duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
        >
            {children}
        </button>
    );
}

function AlmuerzosButton({ type = 'button', children, to }) {
    const handleClick = () => {
        if (to) {
            window.open(to, '_blank', 'noopener,noreferrer'); //abre eñ link en otra pestaña de forma segura
        }
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            className="w-[300px] bg-blue-500 transition delay-700 duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500">
            {children}
        </button>
    );
}
function MyRequestsButton({ type = 'button', children, to }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to); // navegación interna sin recargar
        }
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            className="w-[300px] bg-blue-500 transition delay-700 duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
        >
            {children}
        </button>
    );
}



function ExitButton({ type = 'button', children, to }) {
    const handleClick = () => {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('sessionKey');
        if (to) {
            window.open(to, 'noopener,noreferrer'); //abre eñ link en otra pestaña de forma segura
        }
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            className="w-[150px] bg-blue-500 text-white transition delay-700 duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
        >
            {children}
        </button>
    );
}


export default Links;


