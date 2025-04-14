import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProductExtra } from "@/utils/restaurant/orderTypes";
import { Product } from "@/utils/restaurant/productTypes";

interface ObservationModalProps {
  showModal: boolean;
  onClose: () => void;
  onAdd: (observation: string) => void;
  selectedProduct: Product | null;
  selectedExtras: ProductExtra[];
  initialObservation: string;
}

const ObservationModal: React.FC<ObservationModalProps> = ({
  showModal,
  onClose,
  onAdd,
  selectedProduct,
  selectedExtras,
  initialObservation
}) => {
  const [localObservation, setLocalObservation] = useState("");
  
  useEffect(() => {
    if (showModal) {
      setLocalObservation(initialObservation);
    }
  }, [showModal, initialObservation]);

  const handleCloseModal = () => {
    onClose();
  };

  const handleAddWithObservation = () => {
    onAdd(localObservation);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg md:text-xl font-bold">Adicionar Observação</h2>
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
          Adicione uma observação para este produto
        </div>
        
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-base md:text-lg font-medium">{selectedProduct?.name}</p>
            <p className="text-sm text-gray-500">Preço: R$ {selectedProduct?.price.toFixed(2).replace('.', ',')}</p>
            
            {selectedExtras.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Adicionais selecionados:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedExtras.map(extra => (
                    <span key={extra.id} className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                      {extra.name} (+{extra.price.toFixed(2).replace('.', ',')})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="observation" className="text-sm font-medium">
              Observação para o preparo:
            </label>
            <textarea
              id="observation"
              placeholder="Ex: Sem cebola com creme, com cebolinha papai, bem passado, etc..."
              value={localObservation}
              onChange={(e) => setLocalObservation(e.target.value)}
              className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={4}
            />
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
            onClick={handleAddWithObservation}
            className="md:order-2"
          >
            Adicionar ao pedido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ObservationModal;
