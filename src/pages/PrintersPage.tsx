import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Printer, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPrinterConfigsByRestaurant } from "@/utils/restaurant";
import { useAuth } from "@/contexts/AuthContext";
import { PrinterConfigModal } from "@/components/modals/PrinterConfigModal";
import PrinterDiscoveryModal from "../components/modals/PrinterDiscoveryModal";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkPrinterServerStatus, testPrinter } from '../services/printerServerService';
import { toast } from 'sonner';

const PrintersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { currentRestaurant } = useAuth();

  const { data: printers = [], refetch } = useQuery({
    queryKey: ['printers', currentRestaurant?.id],
    queryFn: () => getPrinterConfigsByRestaurant(currentRestaurant?.id || ''),
    enabled: !!currentRestaurant?.id,
  });

  // Verificar status do servidor de impressão ao carregar a página
  React.useEffect(() => {
    checkServerStatus();
  }, []);

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

  const handleAddPrinter = () => {
    setSelectedPrinter(null);
    setIsModalOpen(true);
  };

  const handleEditPrinter = (printer: any) => {
    setSelectedPrinter(printer);
    setIsModalOpen(true);
  };

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações de Impressora</h1>
          <p className="text-muted-foreground">
            Gerencie suas impressoras térmicas
          </p>
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
            disabled={serverStatus !== 'online'}
            className="flex items-center gap-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Descobrir Impressoras
          </Button>
          
          <Button onClick={handleAddPrinter}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Impressora
          </Button>
        </div>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="manual">Configuração Manual</TabsTrigger>
          <TabsTrigger value="auto">Descoberta Automática</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome de Exibição</TableHead>
                <TableHead>Nome da Impressora no Windows</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Endereço IP</TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPrinter(printer)}
                        title="Editar"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestPrinter(printer.windows_printer_name)}
                        disabled={serverStatus !== 'online'}
                        title="Testar Impressão"
                      >
                        Testar
                      </Button>
                    </div>
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
        </TabsContent>
        
        <TabsContent value="auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Descoberta Automática de Impressoras</h2>
              <p className="text-gray-500">
                O sistema pode detectar automaticamente as impressoras disponíveis no seu computador.
                Para usar esta funcionalidade, certifique-se de que o servidor de impressão está instalado e funcionando.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="text-blue-800 font-medium flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Como funciona
              </h3>
              <ul className="text-blue-700 mt-2 list-disc pl-5 space-y-1">
                <li>O sistema detecta automaticamente todas as impressoras instaladas no computador</li>
                <li>Você pode selecionar qual impressora usar para cada tipo (Balcão, Cozinha, Bar)</li>
                <li>As impressoras configuradas ficam disponíveis para todo o sistema</li>
                <li>Você pode testar a impressão antes de salvar a configuração</li>
              </ul>
            </div>
            
            <div className="flex justify-center">
              <Button 
                size="lg"
                onClick={() => setIsDiscoveryModalOpen(true)}
                disabled={serverStatus !== 'online'}
                className="flex items-center gap-2"
              >
                <Printer className="h-5 w-5" />
                Iniciar Descoberta de Impressoras
              </Button>
            </div>
            
            {serverStatus === 'offline' && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-md p-4">
                <h3 className="text-amber-800 font-medium">Servidor de impressão não encontrado</h3>
                <p className="text-amber-700 mt-1">
                  Verifique se o servidor de impressão está instalado e funcionando corretamente.
                  O servidor deve estar acessível em <code>https://manu.pdv</code>.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={checkServerStatus}
                >
                  Verificar Novamente
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de configuração manual */}
      <PrinterConfigModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
        restaurantId={currentRestaurant?.id || ''}
        existingConfig={selectedPrinter}
      />
      
      {/* Modal de descoberta automática */}
      <PrinterDiscoveryModal 
        isOpen={isDiscoveryModalOpen}
        onClose={() => {
          setIsDiscoveryModalOpen(false);
          refetch(); // Recarregar impressoras após fechar o modal
        }}
      />
    </div>
  );
};

export default PrintersPage;
