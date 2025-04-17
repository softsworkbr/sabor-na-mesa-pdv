import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { toast } from 'sonner';
import { Loader2, Printer, CheckCircle2, AlertCircle } from 'lucide-react';

// Importando os serviços que criamos
import { checkPrinterServerStatus, getAvailablePrinters, testPrinter } from '../../services/printerServerService';
import { createPrinterConfig, getPrinterConfigByType } from '../../services/printerConfigService';
import { PrinterConfig, PrinterType } from '../../utils/printer/types';
import { useAuth } from '../../contexts/AuthContext';

// Constantes para o servidor de impressão
const PRINTER_SERVER_ADDRESS = 'manu.pdv';
const PRINTER_ENDPOINT = '/print';

interface PrinterDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterDiscoveryModal: React.FC<PrinterDiscoveryModalProps> = ({
  isOpen,
  onClose
}) => {
  // Estados para controlar o fluxo do modal
  const [step, setStep] = useState<'checking' | 'discovery' | 'configuration'>('checking');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [printerType, setPrinterType] = useState<PrinterType>(PrinterType.COUNTER);
  const [isDefault, setIsDefault] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  // Obter o ID do restaurante atual
  const { currentRestaurant } = useAuth();
  const restaurantId = currentRestaurant?.id || '';

  // Verificar status do servidor ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      checkServerStatus();
    }
  }, [isOpen]);

  // Função para verificar o status do servidor
  const checkServerStatus = async () => {
    setServerStatus('checking');
    setStep('checking');
    
    try {
      const isOnline = await checkPrinterServerStatus();
      setServerStatus(isOnline ? 'online' : 'offline');
      
      if (isOnline) {
        setStep('discovery');
        loadAvailablePrinters();
      }
    } catch (error) {
      console.error('Erro ao verificar status do servidor:', error);
      setServerStatus('offline');
    }
  };

  // Função para carregar as impressoras disponíveis
  const loadAvailablePrinters = async () => {
    setIsLoading(true);
    try {
      const printers = await getAvailablePrinters();
      setAvailablePrinters(printers);
      
      // Se houver impressoras, seleciona a primeira por padrão
      if (printers.length > 0) {
        setSelectedPrinter(printers[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error);
      toast.error('Não foi possível obter a lista de impressoras');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para testar a impressora selecionada
  const handleTestPrinter = async () => {
    if (!selectedPrinter) return;
    
    setTestStatus('testing');
    try {
      const result = await testPrinter(selectedPrinter);
      setTestStatus(result.success ? 'success' : 'error');
      
      if (result.success) {
        toast.success('Teste de impressão enviado com sucesso!');
      } else {
        toast.error(`Falha no teste: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      setTestStatus('error');
      toast.error('Não foi possível realizar o teste de impressão');
    }
  };

  // Função para salvar a configuração da impressora
  const handleSavePrinter = async () => {
    if (!selectedPrinter) {
      toast.error('Selecione uma impressora para continuar');
      return;
    }
    
    if (!restaurantId) {
      toast.error('Não foi possível identificar o restaurante');
      return;
    }

    setIsLoading(true);
    try {
      // Verificar se já existe uma impressora configurada para este tipo
      const existingConfig = await getPrinterConfigByType(printerType, restaurantId);
      
      if (existingConfig) {
        // Confirmar substituição
        if (!window.confirm(`Já existe uma impressora configurada como ${printerType}. Deseja substituí-la?`)) {
          setIsLoading(false);
          return;
        }
      }
      
      // Criar configuração
      const printerConfig: PrinterConfig = {
        windows_printer_name: selectedPrinter,
        display_name: getPrinterDisplayName(selectedPrinter, printerType),
        restaurant_id: restaurantId,
        endpoint: PRINTER_ENDPOINT,
        ip_address: PRINTER_SERVER_ADDRESS,
        type: printerType,
        isDefault: isDefault
      };
      
      const result = await createPrinterConfig(printerConfig);
      
      if (result) {
        toast.success(`Impressora ${selectedPrinter} configurada com sucesso!`);
        onClose();
      } else {
        toast.error('Não foi possível salvar a configuração da impressora');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Ocorreu um erro ao salvar a configuração');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para gerar um nome de exibição para a impressora
  const getPrinterDisplayName = (printerName: string, type: PrinterType): string => {
    const typeNames = {
      [PrinterType.COUNTER]: 'Balcão',
      [PrinterType.KITCHEN]: 'Cozinha',
      [PrinterType.BAR]: 'Bar',
      [PrinterType.OTHER]: 'Outro'
    };
    
    return `${typeNames[type]} - ${printerName.substring(0, 20)}`;
  };

  // Renderização condicional baseada no passo atual
  const renderContent = () => {
    switch (step) {
      case 'checking':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-16 w-16 animate-spin text-gray-400 mb-4" />
            <p className="text-lg font-medium">Verificando servidor de impressão...</p>
          </div>
        );
        
      case 'discovery':
        return (
          <div className="grid gap-6 py-4">
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-1 ${serverStatus === 'online' ? 'bg-green-100' : 'bg-red-100'}`}>
                {serverStatus === 'online' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <span className="font-medium">
                Servidor de impressão: {serverStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {serverStatus === 'online' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="printer">Impressoras Disponíveis</Label>
                  <Select
                    value={selectedPrinter}
                    onValueChange={setSelectedPrinter}
                    disabled={isLoading || availablePrinters.length === 0}
                  >
                    <SelectTrigger id="printer" className="w-full">
                      <SelectValue placeholder="Selecione uma impressora" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePrinters.map((printer) => (
                        <SelectItem key={printer} value={printer}>
                          {printer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="printerType">Tipo de Impressora</Label>
                  <Select
                    value={printerType}
                    onValueChange={(value) => setPrinterType(value as PrinterType)}
                  >
                    <SelectTrigger id="printerType" className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PrinterType.COUNTER}>Balcão</SelectItem>
                      <SelectItem value={PrinterType.KITCHEN}>Cozinha</SelectItem>
                      <SelectItem value={PrinterType.BAR}>Bar</SelectItem>
                      <SelectItem value={PrinterType.OTHER}>Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isDefault" 
                    checked={isDefault}
                    onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                  />
                  <Label htmlFor="isDefault">Definir como impressora padrão para este tipo</Label>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                  <p className="text-blue-800 text-sm">
                    <strong>Servidor:</strong> {PRINTER_SERVER_ADDRESS} <br />
                    <strong>Endpoint:</strong> {PRINTER_ENDPOINT}
                  </p>
                </div>
                
                <div className="flex justify-between mt-2">
                  <Button
                    variant="outline"
                    onClick={handleTestPrinter}
                    disabled={!selectedPrinter || testStatus === 'testing'}
                    className="flex items-center gap-2"
                  >
                    {testStatus === 'testing' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4" />
                    )}
                    Testar Impressora
                  </Button>
                  
                  {testStatus === 'success' && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Teste bem-sucedido
                    </span>
                  )}
                  
                  {testStatus === 'error' && (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Falha no teste
                    </span>
                  )}
                </div>
              </>
            )}
            
            {serverStatus === 'offline' && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-2">
                <h3 className="text-amber-800 font-medium">Servidor de impressão não encontrado</h3>
                <p className="text-amber-700 mt-1">
                  Verifique se o servidor de impressão está instalado e funcionando corretamente.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={checkServerStatus}
                >
                  Tentar Novamente
                </Button>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuração de Impressoras</DialogTitle>
          <DialogDescription>
            Descubra e configure automaticamente as impressoras disponíveis no sistema.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {step === 'discovery' && serverStatus === 'online' && (
            <Button 
              onClick={handleSavePrinter}
              disabled={isLoading || !selectedPrinter || !restaurantId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrinterDiscoveryModal;
