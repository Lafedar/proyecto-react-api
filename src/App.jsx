import React from 'react';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login";
import Links from "./links";
import Medications from "./medications";
import ProtectedRoute from './ProtectedRoute';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                 
                    <Route path="/links" element={<Links />} />
                    <Route path="/medications" element={<Medications />} />
                

            </Routes>
        </BrowserRouter>
    );
}
