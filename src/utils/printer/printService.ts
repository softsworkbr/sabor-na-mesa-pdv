
import { PrintRequest } from './types';

export const sendPrintRequest = async (printRequest: PrintRequest): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3010/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printRequest),
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar para impressão');
    }

    return true;
  } catch (error) {
    console.error('Erro ao imprimir:', error);
    throw error;
  }
};
