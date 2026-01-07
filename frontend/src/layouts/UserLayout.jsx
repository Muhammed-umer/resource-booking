import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import Home from "../pages/Home";
import Request from "../pages/Request";
import History from "../pages/History";

const UserLayout = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen w-full bg-gray-50 font-sans select-none">
            <Navbar
                toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar
                    isMobileOpen={isMobileSidebarOpen}
                    closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/waiting-request" element={<Request />} />
                        <Route path="/history" element={<History />} />
                    </Routes>
                </main>
            </div>
        </div>
    );

};
export default UserLayout;