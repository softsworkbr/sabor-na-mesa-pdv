
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, PrinterOff } from "lucide-react";
import { getPrinterConfigsByRestaurant } from "@/utils/restaurant";
import { useAuth } from "@/contexts/AuthContext";

interface PrinterSelectorProps {
  value?: string;
  onPrinterSelect: (printerName: string) => void;
}

const PrinterSelector = ({ value, onPrinterSelect }: PrinterSelectorProps) => {
  const { currentRestaurant } = useAuth();

  const { data: printers = [], isLoading } = useQuery({
    queryKey: ['printers', currentRestaurant?.id],
    queryFn: () => getPrinterConfigsByRestaurant(currentRestaurant?.id || ''),
    enabled: !!currentRestaurant?.id,
  });

  return (
    <div className="flex items-center gap-2">
      {printers.length > 0 ? (
        <Printer className="h-4 w-4 text-gray-500" />
      ) : (
        <PrinterOff className="h-4 w-4 text-gray-500" />
      )}
      <Select value={value} onValueChange={onPrinterSelect}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecionar impressora" />
        </SelectTrigger>
        <SelectContent>
          {printers.map((printer) => (
            <SelectItem key={printer.id} value={printer.windows_printer_name}>
              {printer.display_name}
            </SelectItem>
          ))}
          {printers.length === 0 && (
            <SelectItem value="none" disabled>
              Nenhuma impressora configurada
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PrinterSelector;
