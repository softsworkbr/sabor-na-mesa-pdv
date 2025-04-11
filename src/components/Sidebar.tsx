
import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  Utensils, 
  ShoppingCart, 
  Users, 
  Settings, 
  CreditCard, 
  BarChart3, 
  Layers 
} from "lucide-react";

const menuItems = [
  { name: "Principal", icon: Home, to: "/" },
  { name: "Pedidos", icon: ShoppingCart, to: "/orders" },
  { name: "Mesas", icon: Layers, to: "/tables" },
  { name: "Cardápio", icon: Utensils, to: "/menu" },
  { name: "Clientes", icon: Users, to: "/customers" },
  { name: "Pagamentos", icon: CreditCard, to: "/payments" },
  { name: "Relatórios", icon: BarChart3, to: "/reports" },
  { name: "Configurações", icon: Settings, to: "/settings" },
];

const Sidebar = () => {
  return (
    <aside className="bg-white w-64 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="border-b pb-4">
          <div className="text-center">
            <h2 className="font-bold text-lg text-pos-primary">PDV Restaurant</h2>
            <p className="text-xs text-gray-500">Sistema de Gestão</p>
          </div>
        </div>

        <nav className="mt-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-pos-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
