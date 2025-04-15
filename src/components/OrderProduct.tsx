import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, MoreVertical, FileText } from "lucide-react";
import { Printer } from "lucide-react";
import { OrderItem, ProductExtra } from "@/utils/restaurant";

interface OrderProductProps {
  item: OrderItem;
  onChangeQuantity: (newQuantity: number) => void;
  onRemove: () => void;
  onTogglePrintStatus?: (printed: boolean) => void;
  disabled?: boolean;
  isMobile?: boolean;
}

const OrderProduct = ({ 
  item, 
  onChangeQuantity, 
  onRemove, 
  onTogglePrintStatus,
  disabled = false, 
  isMobile = false 
}: OrderProductProps) => {
  return (
    <div className={`${isMobile ? 'p-2' : 'border-b p-3'} flex items-center gap-2 hover:bg-gray-50`}>
      <div className={`bg-gray-200 ${isMobile ? 'p-1 min-w-5' : 'p-2 min-w-6'} rounded-md text-center font-medium`}>
        {item.quantity}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="font-medium text-sm md:text-base truncate">{item.name}</div>
        {item.observation && (
          <div className="text-xs md:text-sm text-gray-500 italic bg-gray-50 p-1 rounded mt-1 line-clamp-2">
            {item.observation}
          </div>
        )}
        
        {item.extras && item.extras.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.extras.map((extra, index) => (
              <div 
                key={extra.id || index} 
                className="text-xs bg-blue-50 text-blue-800 inline-block px-1 md:px-2 py-0.5 rounded truncate max-w-16 md:max-w-none"
                title={`${extra.name} (${extra.price.toFixed(2).replace('.', ',')})`}
              >
                +{extra.name}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="font-semibold min-w-16 md:min-w-20 text-right text-sm md:text-base">
        {(item.price * item.quantity).toFixed(2).replace('.', ',')}
      </div>

      {!isMobile ? (
        <div className="flex items-center">
          {onTogglePrintStatus && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full ${item.printed_at ? 'text-green-600' : 'text-gray-400'}`}
              onClick={() => onTogglePrintStatus(!item.printed_at)}
              disabled={disabled}
              title={item.printed_at ? 'Desmarcar como impresso' : 'Marcar como impresso'}
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
          
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
      ) : (
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full"
            onClick={() => onChangeQuantity(item.quantity + 1)}
            disabled={disabled}
          >
            <Plus className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full text-red-500"
            onClick={onRemove}
            disabled={disabled}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderProduct;
