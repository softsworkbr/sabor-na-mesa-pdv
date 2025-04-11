
import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";

interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar = ({ onMenuToggle }: NavbarProps) => {
  return (
    <header className="bg-white border-b border-gray-200 py-2 px-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onMenuToggle}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold text-pos-primary">Sabor na Mesa</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-pos-primary text-white rounded-full flex items-center justify-center">
            <span className="font-medium text-sm">AG</span>
          </div>
          <span className="text-sm font-medium hidden sm:inline-block">Admin</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
