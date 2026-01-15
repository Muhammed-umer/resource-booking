import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthSwitch from "./auth/AuthSwitch";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<AuthSwitch />} />

        {/* User Dashboard */}
        <Route path="/user/*" element={<UserLayout />} />

        {/* ✅ SEMINAR ADMIN (Admin 1) */}
        <Route path="/admin1/*" element={<AdminLayout type="SEMINAR" />} />

        {/* ✅ RESOURCE ADMIN (Admin 2) */}
        <Route path="/admin2/*" element={<AdminLayout type="RESOURCE" />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;