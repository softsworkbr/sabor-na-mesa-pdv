import { PrintRequest, PrinterType } from './types';
import { sendPrintCommand } from '../../services/printerServerService';
import { getDefaultPrinterForType } from '../../services/printerConfigService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Envia uma requisição de impressão para o servidor
 * @param printRequest Dados da requisição de impressão
 * @returns Promise com status da operação
 */
export const sendPrintRequest = async (printRequest: PrintRequest): Promise<boolean> => {
  try {
    const response = await sendPrintCommand(printRequest);
    
    if (!response.success) {
      throw new Error(response.error || 'Falha ao enviar para impressão');
    }

    return true;
  } catch (error) {
    console.error('Erro ao imprimir:', error);
    toast.error('Falha ao enviar para impressão');
    throw error;
  }
};

/**
 * Imprime um texto em uma impressora específica
 * @param printerName Nome da impressora
 * @param text Texto a ser impresso
 * @param printerId ID opcional da configuração da impressora
 * @param options Opções de formatação
 * @returns Promise com status da operação
 */
export const printText = async (
  printerName: string, 
  text: string, 
  printerId?: string,
  options?: Partial<PrintRequest>
): Promise<boolean> => {
  try {
    const printRequest: PrintRequest = {
      printerName,
      text,
      printerId,
      ...options
    };
    
    return await sendPrintRequest(printRequest);
  } catch (error) {
    console.error('Erro ao imprimir texto:', error);
    return false;
  }
};

/**
 * Imprime um texto na impressora padrão de um determinado tipo
 * @param type Tipo da impressora (counter, kitchen, bar, other)
 * @param text Texto a ser impresso
 * @param restaurantId ID do restaurante
 * @param options Opções de formatação
 * @returns Promise com status da operação
 */
export const printTextOnType = async (
  type: PrinterType,
  text: string,
  restaurantId: string,
  options?: Partial<PrintRequest>
): Promise<boolean> => {
  try {
    // Obtém a configuração da impressora padrão para o tipo
    const printerConfig = await getDefaultPrinterForType(type, restaurantId);
    
    if (!printerConfig) {
      toast.error(`Nenhuma impressora do tipo ${type} configurada`);
      return false;
    }
    
    return await printText(
      printerConfig.windows_printer_name, 
      text, 
      printerConfig.id,
      options
    );
  } catch (error) {
    console.error(`Erro ao imprimir no tipo ${type}:`, error);
    return false;
  }
};

/**
 * Hook para usar o serviço de impressão com o restaurante atual
 * @returns Funções para impressão no contexto do restaurante atual
 */
export const usePrintService = () => {
  const { currentRestaurant } = useAuth();
  const restaurantId = currentRestaurant?.id || '';
  
  /**
   * Imprime um texto na impressora padrão de um determinado tipo
   * @param type Tipo da impressora (counter, kitchen, bar, other)
   * @param text Texto a ser impresso
   * @param options Opções de formatação
   * @returns Promise com status da operação
   */
  const printOnType = async (
    type: PrinterType,
    text: string,
    options?: Partial<PrintRequest>
  ): Promise<boolean> => {
    if (!restaurantId) {
      toast.error('Não foi possível identificar o restaurante');
      return false;
    }
    
    return printTextOnType(type, text, restaurantId, options);
  };
  
  return {
    printOnType,
    printText
  };
};
