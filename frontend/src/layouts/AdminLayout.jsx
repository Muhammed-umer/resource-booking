import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AdminHistory from "../admin/AdminHistory";
import AdminRequests from "../admin/AdminRequests";

const AdminLayout = ({ type }) => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // ✅ Determine Base Path based on Admin Type
    const basePath = type === "SEMINAR" ? "/admin1" : "/admin2";
    const roleType = type === "SEMINAR" ? "ADMIN_SEMINAR" : "ADMIN_RESOURCE";

    return (
        <div className="flex flex-col h-screen w-full bg-gray-50 font-sans select-none">
            <Navbar toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar
                    role={roleType} // Pass specific role
                    basePath={basePath} // Pass specific path (admin1 or admin2)
                    isMobileOpen={isMobileSidebarOpen}
                    closeMobileSidebar={() => setIsMobileSidebarOpen(false)} 
                /> 
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
                    <Routes>
                        {/* ✅ Simplified Nested Routes */}
                        <Route path="dashboard" element={<AdminRequests />} />
                        <Route path="history" element={<AdminHistory />} />
                        
                        {/* Default Redirect */}
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;