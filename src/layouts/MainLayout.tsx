
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { user } = useAuth();

  if (!user) {
    return null; // Não renderiza nada se não estiver autenticado
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 overflow-auto bg-slate-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
