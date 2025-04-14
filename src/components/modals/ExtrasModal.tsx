import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, FileText } from "lucide-react";
import { ProductExtra } from "@/utils/restaurant/orderTypes";
import { Product } from "@/utils/restaurant/productTypes";

interface ExtrasModalProps {
  showModal: boolean;
  onClose: () => void;
  onAddWithExtras: (extras: ProductExtra[]) => void;
  onContinueToObservation: (extras: ProductExtra[]) => void;
  selectedProduct: Product | null;
  availableExtras: ProductExtra[];
  initialSelectedExtras: ProductExtra[];
}

const ExtrasModal: React.FC<ExtrasModalProps> = ({
  showModal,
  onClose,
  onAddWithExtras,
  onContinueToObservation,
  selectedProduct,
  availableExtras,
  initialSelectedExtras
}) => {
  const [localExtras, setLocalExtras] = useState<ProductExtra[]>([]);
  
  useEffect(() => {
    if (showModal) {
      setLocalExtras(initialSelectedExtras);
    }
  }, [showModal, initialSelectedExtras]);

  const handleCloseModal = () => {
    onClose();
  };

  const handleContinueToObservation = () => {
    const extrasToSave = [...localExtras];
    onContinueToObservation(extrasToSave);
  };
  
  const handleAddWithExtras = () => {
    const extrasToSave = [...localExtras];
    onAddWithExtras(extrasToSave);
  };
  
  const toggleExtra = (extra: ProductExtra) => {
    setLocalExtras(prevExtras => {
      const isSelected = prevExtras.some(e => e.id === extra.id);
      
      if (isSelected) {
        return prevExtras.filter(e => e.id !== extra.id);
      } else {
        return [...prevExtras, extra];
      }
    });
  };
  
  const calculateTotalPrice = () => {
    if (!selectedProduct) return 0;
    
    let total = selectedProduct.price;
    localExtras.forEach(extra => {
      total += extra.price;
    });
    
    return total;
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg md:text-xl font-bold">Adicionar Extras</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={handleCloseModal}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-sm text-gray-500 mb-3">
          Selecione os extras para este produto
        </div>
        
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-base md:text-lg font-medium">{selectedProduct?.name}</p>
            <p className="text-sm text-gray-500">Preço base: R$ {selectedProduct?.price.toFixed(2).replace('.', ',')}</p>
            
            {localExtras.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Extras selecionados:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {localExtras.map(extra => (
                    <span key={extra.id} className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                      {extra.name} (+{extra.price.toFixed(2).replace('.', ',')})
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium mt-2">
                  Preço total: R$ {calculateTotalPrice().toFixed(2).replace('.', ',')}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Extras disponíveis:</div>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
              {availableExtras.map(extra => (
                <div 
                  key={extra.id} 
                  className={`border rounded-md p-2 cursor-pointer transition-colors ${
                    localExtras.some(e => e.id === extra.id) 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleExtra(extra)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{extra.name}</p>
                      <p className="text-sm text-gray-500">+ R$ {extra.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    {localExtras.some(e => e.id === extra.id) && (
                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <X className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {availableExtras.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum extra disponível para este produto.
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={handleCloseModal}
            className="md:order-1"
          >
            Cancelar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleContinueToObservation}
            className="md:order-2"
          >
            Adicionar observação
          </Button>
          <Button 
            onClick={handleAddWithExtras}
            className="md:order-3 bg-primary hover:bg-primary/90"
          >
            Adicionar ao pedido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExtrasModal;
