import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isMobileOpen, closeMobileSidebar }) => {
  const role = localStorage.getItem('role'); // Get role from storage

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium mb-2 ${
      isActive ? "bg-white text-primary shadow-md" : "text-white hover:bg-primary-dark"
    }`;

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={closeMobileSidebar} />}
      <aside className={`absolute md:relative z-30 h-full w-64 bg-primary text-white shadow-xl transform transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-5 flex flex-col h-full">
          <nav className="flex-1 mt-2">

            {/* COMMON LINKS */}
            <NavLink to="/" className={linkClasses} onClick={closeMobileSidebar}>Dashboard</NavLink>
            <NavLink to="/history" className={linkClasses} onClick={closeMobileSidebar}>History</NavLink>

            {/* ADMIN ONLY LINK */}
            {role === 'ADMIN' && (
               <>
                 <div className="my-4 border-t border-white/20 pt-4 text-xs font-bold text-white/50 uppercase tracking-wider">Admin Controls</div>
                 <NavLink to="/admin/dashboard" className={linkClasses} onClick={closeMobileSidebar}>
                    Resource Manager
                 </NavLink>
               </>
            )}

            {/* OWNER ONLY LINKS */}
            {role === 'OWNER' && (
              <>
                <div className="my-4 border-t border-white/20 pt-4 text-xs font-bold text-white/50 uppercase tracking-wider">Owner Controls</div>
                <NavLink to="/manage-users" className={linkClasses} onClick={closeMobileSidebar}>Manage Users</NavLink>
                <NavLink to="/audit-logs" className={linkClasses} onClick={closeMobileSidebar}>Audit Logs</NavLink>
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;