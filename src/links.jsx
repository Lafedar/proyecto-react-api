import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/App.css';
import { useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useSession } from '../contexts/SessionContext';
import { refreshAccessToken } from './jwtUtils';

function Links() {
    const { updateAccessToken } = useSession();
    return (
        <Layout>
            <div id="links-container">
                <h1>Links</h1>
                <LunchButton to="https://forms.office.com/Pages/ResponsePage.aspx?id=3zlyfmyFe0ObLZamOIhIW0Tb2ozw6d1Fu5JeRkE3OUtUMTlDTUNFUUVEQ1hRTlkwV0ZTVzZUMFRSVS4u">
                    Almuerzos
                </LunchButton>
                <MedicalCertificatesButton to="/medicalCertificates">Certificados Médicos</MedicalCertificatesButton>
                <MedicationButton to="/medications">Solicitudes de Medicamentos</MedicationButton>
                <MyRequestsButton to="/myRequests">Mis Solicitudes de Medicamentos</MyRequestsButton>
                <ExitButton to="/">Salir</ExitButton>
            </div>

        </Layout>

    )


}

function LunchButton({ type = 'button', children, to, updateAccessToken}) {
    const handleClick = () => {
        if (to) {
            if (to.startsWith('http')) {
                window.location.href = to;
                refreshAccessToken(updateAccessToken);
            } else {
                navigate(to);
                refreshAccessToken(updateAccessToken);
            }
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
function MedicalCertificatesButton({ type = 'button', children, to, updateAccessToken }) {
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
            className="w-[300px] bg-blue-500 transition delay-700 duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
        >
            {children}
        </button>
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
            className="w-[300px] bg-blue-500 transition delay-700 duration-700 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
        >
            {children}
        </button>
    );
}

function MyRequestsButton({ type = 'button', children, to, updateAccessToken }) {
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
            window.location.href = to;
            
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


