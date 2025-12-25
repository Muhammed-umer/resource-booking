import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isMobileOpen, closeMobileSidebar }) => {

  // Link Styles
  // Active: White background with Primary text (Visual highlight)
  // Inactive: White text with Primary Dark hover
  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium mb-2 ${
      isActive
        ? "bg-white text-primary shadow-md"       // Active State
        : "text-white hover:bg-primary-dark"      // Inactive State
    }`;

  return (
    <>
      {/* Mobile Overlay (Darkens screen when menu is open on mobile) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          absolute md:relative z-30
          h-full w-64 bg-primary text-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-5 flex flex-col h-full">

          {/* Navigation Links */}
          <nav className="flex-1 mt-2">

            <NavLink to="/" className={linkClasses} onClick={closeMobileSidebar}>
              {/* Home Icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </NavLink>



            <NavLink to="/history" className={linkClasses} onClick={closeMobileSidebar}>
              {/* History Icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Request History
            </NavLink>

                       {/* <NavLink to="/waiting-request" className={linkClasses} onClick={closeMobileSidebar}>
              // Report/Request Icon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Summary Report
            </NavLink> */}

          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;