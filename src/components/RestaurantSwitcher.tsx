
import React, { useState } from "react";
import {
  Building2,
  ChevronsUpDown,
  Store,
  UserCircle,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const RestaurantSwitcher = () => {
  const { restaurants, currentRestaurant, setCurrentRestaurant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (!restaurants || restaurants.length === 0) {
    return null;
  }

  const roleIcons = {
    owner: <UserCircle className="mr-2 h-4 w-4" />,
    manager: <Building2 className="mr-2 h-4 w-4" />,
    staff: <Store className="mr-2 h-4 w-4" />,
  };

  const handleManageRestaurants = () => {
    setCurrentRestaurant(null);
    navigate("/");
    setIsOpen(false);
  };

  const handleSelectRestaurant = (restaurant: typeof currentRestaurant) => {
    if (restaurant) {
      setCurrentRestaurant(restaurant);
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between md:w-[240px] h-9 px-3"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar className="h-5 w-5">
              <AvatarImage src={currentRestaurant?.logo_url || null} />
              <AvatarFallback className="bg-pos-primary text-white text-xs">
                {currentRestaurant?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{currentRestaurant?.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]">
        {restaurants.map((restaurant) => (
          <DropdownMenuItem
            key={restaurant.id}
            onClick={() => handleSelectRestaurant(restaurant)}
            className={cn(
              "flex items-center gap-2 p-2",
              currentRestaurant?.id === restaurant.id && "bg-accent"
            )}
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={restaurant.logo_url || null} />
              <AvatarFallback className="bg-pos-primary text-white text-xs">
                {restaurant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{restaurant.name}</span>
              <div className="flex items-center text-xs text-muted-foreground">
                {roleIcons[restaurant.role]}
                <span className="capitalize">{restaurant.role}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleManageRestaurants} className="p-2">
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Gerenciar Restaurantes</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RestaurantSwitcher;
