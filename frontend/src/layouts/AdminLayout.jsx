// src/layouts/AdminLayout.jsx
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

// Reuse existing components
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

// Import Admin Pages
import SeminarAdmin from "../admin/SeminarAdmin";
import ResourceAdmin from "../admin/ResourceAdmin";

const AdminLayout = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen w-full bg-gray-50 font-sans select-none">
            {/* Common Header */}
            <Navbar
                toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Common Sidebar */}
                <Sidebar
                    isMobileOpen={isMobileSidebarOpen}
                    closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
                />

                {/* Main Content Area - Changes based on route */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
                    <Routes>
                        {/* Note: Paths are relative to the parent route "/admin" */}
                        <Route path="seminar" element={<SeminarAdmin />} />
                        <Route path="resource" element={<ResourceAdmin />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout; 