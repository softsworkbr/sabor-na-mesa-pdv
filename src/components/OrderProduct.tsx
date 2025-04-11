
import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, MoreVertical, Printer } from "lucide-react";
import { OrderItem } from "@/utils/restaurant";

interface OrderProductProps {
  item: OrderItem;
  onChangeQuantity: (newQuantity: number) => void;
  onRemove: () => void;
}

const OrderProduct = ({ item, onChangeQuantity, onRemove }: OrderProductProps) => {
  return (
    <div className="border-b p-3 flex items-center gap-2 hover:bg-gray-50">
      <div className="bg-gray-200 p-2 rounded-md min-w-6 text-center font-medium">
        {item.quantity}
      </div>
      
      <div className="flex-grow">
        <div className="font-medium">{item.name}</div>
        {item.observation && (
          <div className="text-sm text-gray-500 italic">
            {item.observation}
          </div>
        )}
      </div>
      
      <div className="font-semibold min-w-20 text-right">
        {(item.price * item.quantity).toFixed(2).replace('.', ',')}
      </div>

      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full hover:bg-green-50"
          onClick={() => onChangeQuantity(item.quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full hover:bg-red-50"
          onClick={() => onChangeQuantity(item.quantity - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full text-gray-500 hover:text-gray-800"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full text-gray-500 hover:text-gray-800"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OrderProduct;
