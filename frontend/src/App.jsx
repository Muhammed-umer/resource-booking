import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Request from "./pages/Request.jsx";
import History from "./pages/History.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";

const App = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-full bg-gray-50 font-sans select-none">
        {/* Navbar */}
        <Navbar
          toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Content Body */}
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
    </BrowserRouter>
  );
};

export default App;
