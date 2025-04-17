import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { toast } from 'sonner';
import { Printer, Plus, RefreshCw, Trash2 } from 'lucide-react';
import PrinterDiscoveryModal from './modals/PrinterDiscoveryModal';
import { getAllPrinterConfigs, deletePrinterConfig } from '../services/printerConfigService';
import { checkPrinterServerStatus, testPrinter } from '../services/printerServerService';
import { PrinterConfig, PrinterType } from '../utils/printer/types';

const PrinterManager: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Carregar impressoras ao montar o componente
  useEffect(() => {
    loadPrinters();
    checkServerStatus();
  }, []);

  // Função para verificar o status do servidor de impressão
  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const isOnline = await checkPrinterServerStatus();
      setServerStatus(isOnline ? 'online' : 'offline');
    } catch (error) {
      console.error('Erro ao verificar status do servidor:', error);
      setServerStatus('offline');
    }
  };

  // Função para carregar as impressoras configuradas
  const loadPrinters = async () => {
    setIsLoading(true);
    try {
      const printerConfigs = await getAllPrinterConfigs();
      setPrinters(printerConfigs);
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error);
      toast.error('Não foi possível carregar as configurações de impressoras');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para testar uma impressora
  const handleTestPrinter = async (printerName: string) => {
    try {
      const result = await testPrinter(printerName);
      
      if (result.success) {
        toast.success('Teste de impressão enviado com sucesso!');
      } else {
        toast.error(`Falha no teste: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao testar impressora:', error);
      toast.error('Não foi possível realizar o teste de impressão');
    }
  };

  // Função para remover uma impressora
  const handleDeletePrinter = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta impressora?')) {
      return;
    }
    
    try {
      const success = await deletePrinterConfig(id);
      
      if (success) {
        loadPrinters();
      }
    } catch (error) {
      console.error('Erro ao remover impressora:', error);
      toast.error('Não foi possível remover a impressora');
    }
  };

  // Função para obter o nome do tipo de impressora
  const getPrinterTypeName = (printer: PrinterConfig): string => {
    // Verificar o prefixo do display_name para determinar o tipo
    if (printer.display_name.startsWith('Balcão')) return 'Balcão';
    if (printer.display_name.startsWith('Cozinha')) return 'Cozinha';
    if (printer.display_name.startsWith('Bar')) return 'Bar';
    return 'Outro';
  };

  // Função para obter a cor do cartão com base no tipo
  const getCardColor = (printer: PrinterConfig): string => {
    const type = getPrinterTypeName(printer);
    switch (type) {
      case 'Balcão': return 'bg-blue-50 border-blue-200';
      case 'Cozinha': return 'bg-green-50 border-green-200';
      case 'Bar': return 'bg-amber-50 border-amber-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Impressoras</h1>
          <p className="text-gray-500">Configure e gerencie suas impressoras térmicas</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${
            serverStatus === 'online' 
              ? 'bg-green-100 text-green-800' 
              : serverStatus === 'offline'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              serverStatus === 'online' 
                ? 'bg-green-500' 
                : serverStatus === 'offline'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
            }`} />
            <span className="text-sm font-medium">
              {serverStatus === 'online' 
                ? 'Servidor Online' 
                : serverStatus === 'offline'
                  ? 'Servidor Offline'
                  : 'Verificando...'}
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={checkServerStatus}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
          <Button 
            onClick={() => setIsDiscoveryModalOpen(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Nova Impressora
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : printers.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Printer className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma impressora configurada</h3>
          <p className="text-gray-500 mb-4">
            Adicione uma impressora para começar a imprimir comandas e recibos.
          </p>
          <Button 
            onClick={() => setIsDiscoveryModalOpen(true)}
            className="flex items-center gap-1 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Adicionar Impressora
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printers.map((printer) => (
            <Card 
              key={printer.id} 
              className={`border ${getCardColor(printer)}`}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{printer.display_name}</span>
                  <div className="bg-white p-1 rounded-full">
                    <Printer className="h-5 w-5 text-gray-500" />
                  </div>
                </CardTitle>
                <CardDescription>
                  Tipo: {getPrinterTypeName(printer)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  <p><strong>Nome no Sistema:</strong> {printer.windows_printer_name}</p>
                  {printer.endpoint && (
                    <p><strong>Endpoint:</strong> {printer.endpoint}</p>
                  )}
                  {printer.ip_address && (
                    <p><strong>IP:</strong> {printer.ip_address}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTestPrinter(printer.windows_printer_name)}
                  disabled={serverStatus !== 'online'}
                >
                  Testar Impressão
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeletePrinter(printer.id!)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de descoberta e configuração de impressoras */}
      <PrinterDiscoveryModal 
        isOpen={isDiscoveryModalOpen}
        onClose={() => {
          setIsDiscoveryModalOpen(false);
          loadPrinters(); // Recarregar impressoras após fechar o modal
        }}
      />
    </div>
  );
};

export default PrinterManager;
