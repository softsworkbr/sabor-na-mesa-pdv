
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Printer, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPrinterConfigsByRestaurant } from "@/utils/restaurant";
import { useAuth } from "@/contexts/AuthContext";
import { OrderItem } from "@/utils/restaurant";
import { toast } from "sonner";
import { printOrderItemsToMultiplePrinters } from "@/utils/printer/printOrderService";

interface PrinterSelectorModalProps {
  showModal: boolean;
  onClose: () => void;
  onPrinterSelect: (printerName: string) => void;
  onPrint: (printerNames: string[]) => void;
  selectedPrinter?: string;
  items?: OrderItem[];
  orderInfo?: {
    orderNumber?: string;
    tableName?: string;
    customerName?: string;
  };
}

const PrinterSelectorModal: React.FC<PrinterSelectorModalProps> = ({
  showModal,
  onClose,
  onPrinterSelect,
  onPrint,
  selectedPrinter: initialSelectedPrinter,
  items,
  orderInfo
}) => {
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>(initialSelectedPrinter ? [initialSelectedPrinter] : []);
  const [isPrinting, setIsPrinting] = useState(false);
  const { currentRestaurant } = useAuth();

  useEffect(() => {
    if (initialSelectedPrinter) {
      setSelectedPrinters([initialSelectedPrinter]);
    }
  }, [initialSelectedPrinter, showModal]);

  const { data: printers = [], isLoading } = useQuery({
    queryKey: ['printers', currentRestaurant?.id],
    queryFn: () => getPrinterConfigsByRestaurant(currentRestaurant?.id || ''),
    enabled: !!currentRestaurant?.id && showModal,
  });

  const handlePrinterToggle = (printerName: string) => {
    setSelectedPrinters(prev => {
      if (prev.includes(printerName)) {
        // Remove printer if already selected
        return prev.filter(name => name !== printerName);
      } else {
        // Add printer if not selected
        return [...prev, printerName];
      }
    });
    
    // Still call onPrinterSelect with the last selected printer for backward compatibility
    onPrinterSelect(printerName);
  };

  const handlePrint = async () => {
    if (selectedPrinters.length === 0) return;
    
    try {
      setIsPrinting(true);
      
      // Standard onPrint callback for backward compatibility
      onPrint(selectedPrinters);
      
      // Use the new printing service if items are provided
      if (items && items.length > 0) {
        await printOrderItemsToMultiplePrinters(selectedPrinters, items, orderInfo);
        toast.success('Pedido enviado para impressão');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.error('Falha ao imprimir. Verifique a impressora.');
    } finally {
      setIsPrinting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 p-4 md:p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold">Selecionar Impressoras</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          Selecione uma ou mais impressoras para imprimir o pedido
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : printers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {printers.map((printer) => (
                <div 
                  key={printer.id} 
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedPrinters.includes(printer.windows_printer_name) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }
                  `}
                  onClick={() => handlePrinterToggle(printer.windows_printer_name)}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      <Printer className={`h-5 w-5 ${selectedPrinters.includes(printer.windows_printer_name) ? 'text-blue-500' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-base">{printer.display_name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{printer.windows_printer_name}</p>
                    </div>
                    {selectedPrinters.includes(printer.windows_printer_name) && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedPrinters.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-100">
                <p className="text-sm font-medium text-blue-800 mb-1">Impressoras selecionadas ({selectedPrinters.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPrinters.map(printerName => {
                    const printer = printers.find(p => p.windows_printer_name === printerName);
                    return (
                      <div key={printerName} className="bg-white text-blue-700 text-xs px-2 py-1 rounded flex items-center">
                        <span>{printer?.display_name || printerName}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrinterToggle(printerName);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg mb-6">
            <Printer className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma impressora configurada</p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="sm:order-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handlePrint}
            className="sm:order-2"
            disabled={selectedPrinters.length === 0 || isPrinting}
          >
            {isPrinting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Imprimindo...
              </>
            ) : selectedPrinters.length > 1 
              ? `Imprimir em ${selectedPrinters.length} impressoras` 
              : "Imprimir"
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrinterSelectorModal;
