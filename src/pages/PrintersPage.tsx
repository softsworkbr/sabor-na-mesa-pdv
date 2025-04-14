
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPrinterConfigsByRestaurant } from "@/utils/restaurant";
import { useAuth } from "@/contexts/AuthContext";
import { PrinterConfigModal } from "@/components/modals/PrinterConfigModal";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";

const PrintersPage = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<any>(null);
  const { currentRestaurant } = useAuth();

  const { data: printers = [], refetch } = useQuery({
    queryKey: ['printers', currentRestaurant?.id],
    queryFn: () => getPrinterConfigsByRestaurant(currentRestaurant?.id || ''),
    enabled: !!currentRestaurant?.id,
  });

  const handleAddPrinter = () => {
    setSelectedPrinter(null);
    setIsModalOpen(true);
  };

  const handleEditPrinter = (printer: any) => {
    setSelectedPrinter(printer);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações de Impressora</h1>
          <p className="text-muted-foreground">
            Gerencie suas impressoras térmicas
          </p>
        </div>
        <Button onClick={handleAddPrinter}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Impressora
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome de Exibição</TableHead>
              <TableHead>Nome da Impressora no Windows</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Endereço IP</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {printers.map((printer) => (
              <TableRow key={printer.id}>
                <TableCell>{printer.display_name}</TableCell>
                <TableCell>{printer.windows_printer_name}</TableCell>
                <TableCell>{printer.endpoint || '-'}</TableCell>
                <TableCell>{printer.ip_address || '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPrinter(printer)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {printers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Nenhuma impressora configurada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PrinterConfigModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
        restaurantId={currentRestaurant?.id || ''}
        existingConfig={selectedPrinter}
      />
    </div>
  );
};

export default PrintersPage;
