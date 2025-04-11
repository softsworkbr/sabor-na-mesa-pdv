import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar = ({ onMenuToggle }: NavbarProps) => {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };
  
  const getUserInitials = () => {
    if (!user) return "?";
    
    const fullName = user.user_metadata?.full_name || user.email || "";
    if (!fullName) return "?";
    
    return fullName
      .split(" ")
      .map(name => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

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
        
        {user && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-pos-primary text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block">
                {user.user_metadata?.username || user.email?.split('@')[0]}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
