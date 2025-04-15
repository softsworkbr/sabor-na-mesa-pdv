
import { PrintRequest } from './types';
import { toast } from "sonner";

export const sendPrintRequest = async (printRequest: PrintRequest): Promise<boolean> => {
  try {
    console.log('Enviando solicitação de impressão para:', printRequest.printerName);
    
    const response = await fetch('http://localhost:3010/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Falha na resposta do serviço de impressão:', errorText);
      throw new Error(`Falha ao enviar para impressão: ${response.status} ${response.statusText}`);
    }

    console.log('Impressão enviada com sucesso para:', printRequest.printerName);
    return true;
  } catch (error: any) {
    console.error('Erro ao imprimir:', error);
    toast.error(`Erro ao imprimir: ${error.message || 'Falha de comunicação com o serviço de impressão'}`);
    throw error;
  }
};
