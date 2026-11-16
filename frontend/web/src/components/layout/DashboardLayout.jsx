
import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="min-h-screen lg:pl-72">
        {/* Navbar */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
