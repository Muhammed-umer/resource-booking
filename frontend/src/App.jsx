import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthSwitch from "./auth/AuthSwitch";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
// import SeminarAdmin from "./admin/SeminarAdmin";
// import ResourceAdmin from "./admin/ResourceAdmin";


const App = () => {
  return (
      <BrowserRouter>
        <Routes>

          {/* Auth */}
          <Route path="/" element={<AuthSwitch />} />

          {/* User Dashboard */}
          <Route path="/user/*" element={<UserLayout />} />

          {/* Admin Dashboards */}
          {/* <Route path="/admin/seminar" element={<SeminarAdmin />} />
          <Route path="/admin/resource" element={<ResourceAdmin />} /> */}
          <Route path="/admin/*" element={<AdminLayout />} /> 
          
        </Routes>
      </BrowserRouter>
  );
};
export default App;