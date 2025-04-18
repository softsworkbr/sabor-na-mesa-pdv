import axios from 'axios';
import { toast } from 'sonner';
import { getPrinterConfigById } from './printerConfigService';

// URL base padrão do servidor de impressão
const DEFAULT_BASE_URL = 'https://manu.pdv';

// Interface para as opções de impressão
export interface PrintOptions {
  align?: 'left' | 'center' | 'right';
  font?: 'A' | 'B';
  doubleSize?: boolean;
  bold?: boolean;
  beep?: boolean;
}

// Interface para QR Code
export interface QRCodeOptions {
  content: string;
  size?: number;
  position?: 'left' | 'center' | 'right';
}

// Interface para Logo
export interface LogoOptions {
  path?: string;
  url?: string;
  base64?: string;
  width?: number;
}

// Interface para a requisição de impressão
export interface PrintRequest {
  printerName: string;
  text: string;
  options?: PrintOptions;
  qrcode?: QRCodeOptions;
  logo?: LogoOptions;
  printerId?: string; // ID opcional da configuração da impressora
}

// Interface para a resposta da impressão
export interface PrintResponse {
  success: boolean;
  error?: string;
}

/**
 * Verifica se o servidor de impressão está online
 * @returns Promise com status do servidor
 */
export const checkPrinterServerStatus = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${DEFAULT_BASE_URL}/status`);
    return response.data?.status === 'online';
  } catch (error) {
    // Apenas loga no console, não mostra toast nem propaga erro para o usuário
    if (process.env.NODE_ENV !== 'production') {
      console.error('Erro ao verificar status do servidor de impressão:', error);
    }
    return false;
  }
};

/**
 * Obtém a lista de impressoras disponíveis no sistema
 * @returns Promise com array de nomes de impressoras
 */
export const getAvailablePrinters = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${DEFAULT_BASE_URL}/printers`);
    return response.data || [];
  } catch (error) {
    console.error('Erro ao obter lista de impressoras:', error);
    toast.error('Não foi possível obter a lista de impressoras disponíveis');
    return [];
  }
};

/**
 * Obtém a URL base para uma impressora específica
 * @param printerId ID da configuração da impressora
 * @returns URL base para a impressora
 */
export const getPrinterBaseUrl = async (printerId?: string): Promise<string> => {
  if (!printerId) return DEFAULT_BASE_URL;
  
  try {
    const printerConfig = await getPrinterConfigById(printerId);
    
    if (!printerConfig) return DEFAULT_BASE_URL;
    
    // Se a impressora tem um endereço IP configurado, usa ele
    if (printerConfig.ip_address) {
      // Verifica se o endereço já tem o protocolo
      if (printerConfig.ip_address.startsWith('http')) {
        return printerConfig.ip_address;
      }
      return `https://${printerConfig.ip_address}`;
    }
    
    return DEFAULT_BASE_URL;
  } catch (error) {
    console.error('Erro ao obter URL base da impressora:', error);
    return DEFAULT_BASE_URL;
  }
};

/**
 * Obtém o endpoint para uma impressora específica
 * @param printerId ID da configuração da impressora
 * @returns Endpoint para a impressora
 */
export const getPrinterEndpoint = async (printerId?: string): Promise<string> => {
  if (!printerId) return '/print';
  
  try {
    const printerConfig = await getPrinterConfigById(printerId);
    
    if (!printerConfig || !printerConfig.endpoint) return '/print';
    
    // Garante que o endpoint comece com /
    return printerConfig.endpoint.startsWith('/') 
      ? printerConfig.endpoint 
      : `/${printerConfig.endpoint}`;
  } catch (error) {
    console.error('Erro ao obter endpoint da impressora:', error);
    return '/print';
  }
};

/**
 * Envia um comando de impressão para o servidor
 * @param request Dados da requisição de impressão
 * @returns Promise com resultado da impressão
 */
export const sendPrintCommand = async (request: PrintRequest): Promise<PrintResponse> => {
  try {
    // Obtém a URL base e o endpoint para a impressora
    const baseUrl = await getPrinterBaseUrl(request.printerId);
    const endpoint = await getPrinterEndpoint(request.printerId);
    
    const response = await axios.post(`${baseUrl}${endpoint}`, request);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar comando de impressão:', error);
    toast.error('Falha ao enviar comando para a impressora');
    return { success: false, error: error.message };
  }
};

/**
 * Testa a conexão com uma impressora específica
 * @param printerName Nome da impressora a ser testada
 * @param printerId ID opcional da configuração da impressora
 * @returns Promise com resultado do teste
 */
export const testPrinter = async (printerName: string, printerId?: string): Promise<PrintResponse> => {
  const testText = 
`================================
      TESTE DE IMPRESSÃO
================================
Impressora: ${printerName}
Data: ${new Date().toLocaleDateString()}
Hora: ${new Date().toLocaleTimeString()}

Teste realizado com sucesso!
================================
`;

  return sendPrintCommand({
    printerName,
    text: testText,
    options: {
      align: 'center',
      font: 'A',
      bold: true,
      beep: true
    },
    printerId
  });
};
