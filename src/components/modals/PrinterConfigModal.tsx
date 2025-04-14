
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPrinterConfig, updatePrinterConfig } from "@/utils/restaurant";
import { useToast } from "@/hooks/use-toast";
import { PrinterConfig, CreatePrinterConfigProps } from "@/utils/restaurant";

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  existingConfig?: PrinterConfig;
}

export const PrinterConfigModal: React.FC<PrinterConfigModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  existingConfig
}) => {
  const { toast } = useToast();
  const [windowsPrinterName, setWindowsPrinterName] = useState(existingConfig?.windows_printer_name || '');
  const [displayName, setDisplayName] = useState(existingConfig?.display_name || '');
  const [endpoint, setEndpoint] = useState(existingConfig?.endpoint || '');
  const [ipAddress, setIpAddress] = useState(existingConfig?.ip_address || '');

  const handleSubmit = async () => {
    try {
      const printerConfigData: CreatePrinterConfigProps = {
        restaurant_id: restaurantId,
        windows_printer_name: windowsPrinterName,
        display_name: displayName,
        endpoint: endpoint || null,
        ip_address: ipAddress || null
      };

      if (existingConfig) {
        await updatePrinterConfig(existingConfig.id, printerConfigData);
        toast({ title: "Configuração de Impressora Atualizada", variant: "default" });
      } else {
        await createPrinterConfig(printerConfigData);
        toast({ title: "Configuração de Impressora Criada", variant: "default" });
      }

      onClose();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Não foi possível salvar a configuração da impressora", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingConfig ? "Editar Configuração de Impressora" : "Nova Configuração de Impressora"}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da sua impressora térmica 80mm.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="windowsPrinterName" className="text-right">
              Nome da Impressora no Windows
            </Label>
            <Input
              id="windowsPrinterName"
              value={windowsPrinterName}
              onChange={(e) => setWindowsPrinterName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Microsoft Print to PDF"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="displayName" className="text-right">
              Nome de Identificação
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Cozinha, Balcão"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endpoint" className="text-right">
              Endpoint
            </Label>
            <Input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="col-span-3"
              placeholder="URL do serviço de impressão (opcional)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ipAddress" className="text-right">
              Endereço IP
            </Label>
            <Input
              id="ipAddress"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="col-span-3"
              placeholder="Endereço IP da impressora (opcional)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!windowsPrinterName || !displayName}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
