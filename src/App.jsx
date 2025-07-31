import React from 'react';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login";
import Links from "./links";
import Medications from "./medications";
import MyRequests from "./myRequests";
import CreateUser from './createUser';
import VerifyEmail from './verifyEmail';
import MailResetPassword from './mailResetPassword';
import Documentation from './documentation';
import MyDocumentation from './myDocumentation';
import UpdateDataUser from './updateDataUser';
import ResetPassword from './resetPassword';
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
                        <Route path="/documentation" element={<Documentation />} />
                        <Route path="/updateData" element={<UpdateDataUser />} />
                        <Route path="/myDocumentation" element={<MyDocumentation />} />
                    </Route>

                    <Route path="/createUser" element={<CreateUser />} />
                    <Route path="/verifyEmail" element={<VerifyEmail />} />
                    <Route path="/mailResetPassword" element={<MailResetPassword />} />
                    <Route path="/resetPassword" element={<ResetPassword />} />

                </Routes>
            </BrowserRouter>
        </SessionProvider>

    );
}
