import React, { useState } from 'react';
import logo from '../images/logo.png';
import '../styles/Layout.css';


export default function Layout({ children }) {
    return (
        <>
            <Header />
            <main>{children}</main>
            <Footer />
        </>
    );
}

const Header = () => (
    <header className="page-header d-flex justify-content-between align-items-center py-3">
        <div className="logo">
            <a href="/">
                <img
                    src={logo}
                    alt="Logo de Laboratorio Lafedar S.A."
                />
            </a>
        </div>
    </header>
);
const Footer = () => (
    <footer className="text-center py-3">
        <p>Laboratorio Lafedar S.A. | Laboratorios Federales Argentinos S.A</p>
    </footer>
);