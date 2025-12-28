import React from "react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/white.ico';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="h-16 w-full bg-primary text-white flex items-center justify-between px-4 md:px-6 shadow-lg z-50 relative">
      <div className="flex items-center gap-4">
        {/* Mobile Toggle */}
        <button onClick={toggleSidebar} className="block md:hidden p-1 rounded hover:bg-primary-dark">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10" />
          <span className="text-lg font-semibold tracking-wide">Resource Booking</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-sm text-white/80">
          {localStorage.getItem('role') || 'User'}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors border border-white/10"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;