import React from 'react';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login";
import Links from "./links";
import Medications from "./medications";
import MyRequests from "./myRequests";
import ProtectedRoute from './ProtectedRoute';
import { SessionProvider } from './contexts/SessionContext';


export default function App() {
    return (
        <SessionProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/links" element={<Links />} />
                        <Route path="/medications" element={<Medications />} />
                        <Route path="/myRequests" element={<MyRequests />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </SessionProvider>

    );
}
