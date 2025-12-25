import React from "react";
import logo from '../assets/white.ico';

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="h-16 w-full bg-primary text-white flex items-center justify-between px-4 md:px-6 shadow-lg z-50 relative">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="block md:hidden p-1 rounded hover:bg-primary-dark transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo Section */}
        <div className="flex items-center gap-3">
         <img
  src={logo}
  alt="College Logo"
  className="w-10 h-10 "
/>
          <span className="text-lg font-semibold tracking-wide">
            Resource Booking
          </span>
        </div>
      </div>

      {/* Right Corner: Profile */}
      <div className="flex items-center">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all border border-white/30 shadow-sm">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
