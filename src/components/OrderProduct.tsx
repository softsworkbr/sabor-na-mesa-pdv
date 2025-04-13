
import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, MoreVertical, FileText } from "lucide-react";
import { OrderItem, ProductExtra } from "@/utils/restaurant";

interface OrderProductProps {
  item: OrderItem;
  onChangeQuantity: (newQuantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const OrderProduct = ({ item, onChangeQuantity, onRemove, disabled = false }: OrderProductProps) => {
  // Calcular preço base (sem adicionais)
  const basePrice = item.extras && item.extras.length > 0 
    ? item.price - item.extras.reduce((sum, extra) => sum + extra.price, 0) 
    : item.price;
    
  return (
    <div className="border-b p-3 flex items-center gap-2 hover:bg-gray-50">
      <div className="bg-gray-200 p-2 rounded-md min-w-6 text-center font-medium">
        {item.quantity}
      </div>
      
      <div className="flex-grow">
        <div className="font-medium">{item.name}</div>
        
        {/* Preço base */}
        <div className="text-sm text-gray-600">
          R$ {basePrice.toFixed(2).replace('.', ',')}
        </div>
        
        {/* Adicionais */}
        {item.extras && item.extras.length > 0 && (
          <div className="mt-1.5">
            {item.extras.map((extra, index) => (
              <div key={extra.id || index} className="flex items-center text-xs">
                <span className="text-blue-600">+ {extra.name}</span>
                <span className="ml-1 text-gray-500">(R$ {extra.price.toFixed(2).replace('.', ',')})</span>
              </div>
            ))}
            <div className="text-xs font-medium mt-0.5">
              Subtotal com adicionais: R$ {item.price.toFixed(2).replace('.', ',')}
            </div>
          </div>
        )}
        
        {/* Observações */}
        {item.observation && (
          <div className="text-sm text-gray-500 italic bg-gray-50 p-1 rounded mt-1 border-l-2 border-amber-400">
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
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full hover:bg-red-50"
          onClick={() => onChangeQuantity(item.quantity - 1)}
          disabled={disabled}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full text-gray-500 hover:text-gray-800"
          onClick={onRemove}
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full text-gray-500 hover:text-gray-800"
          disabled={disabled}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OrderProduct;
