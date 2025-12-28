import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Request from "./pages/Request.jsx";
import History from "./pages/History.jsx";
import Login from "./pages/Login.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import AuditLogs from "./pages/admin/AuditLogs.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx"; // <--- NEW IMPORT
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";

// --- LAYOUT COMPONENT ---
const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans select-none">
      <Navbar toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// --- SECURITY WRAPPERS ---

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  return token ? <DashboardLayout /> : <Navigate to="/login" replace />;
};

// Only for the "Super Admin" / Owner who manages users
const OwnerRoute = () => {
  const role = localStorage.getItem("role");
  // Adjust 'OWNER' to match exactly what your backend sends (e.g., 'ROLE_OWNER' or 'OWNER')
  return role === "OWNER" ? <Outlet /> : <Navigate to="/" replace />;
};

// --- MAIN APP COMPONENT ---

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (Requires Login) */}
        <Route element={<ProtectedRoute />}>

          {/* General Routes for all logged-in users */}
          <Route path="/" element={<Home />} />
          <Route path="/waiting-request" element={<Request />} />
          <Route path="/history" element={<History />} />

          {/* --- ADMIN DASHBOARD (New) --- */}
          {/* This page self-regulates content based on the admin's resource */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Owner Only Routes (Security) */}
          <Route element={<OwnerRoute />}>
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>

        </Route>

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;