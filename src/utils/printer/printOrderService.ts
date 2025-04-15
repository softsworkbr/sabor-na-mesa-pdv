
import { OrderItem } from "@/utils/restaurant";
import { PrintRequest, PrinterOptions } from './types';
import { sendPrintRequest } from './printService';

// Format options for different sections of the receipt
const HEADER_OPTIONS: PrinterOptions = { 
  align: 'center', 
  font: 'A', 
  doubleSize: true, 
  bold: true
};

const TITLE_OPTIONS: PrinterOptions = { 
  align: 'center', 
  font: 'A', 
  doubleSize: false, 
  bold: true
};

const NORMAL_OPTIONS: PrinterOptions = { 
  align: 'left', 
  font: 'A', 
  doubleSize: false, 
  bold: false 
};

/**
 * Formats and prints an order receipt
 */
export const printOrderItems = async (
  printerName: string,
  items: OrderItem[],
  orderInfo?: { 
    orderNumber?: string;
    tableName?: string;
    customerName?: string;
  }
): Promise<boolean> => {
  try {
    if (!items || items.length === 0) {
      throw new Error('Nenhum item para imprimir');
    }

    let receiptText = '';

    // Add header
    receiptText += '=== PEDIDO ===\n\n';
    
    // Add order information if available
    if (orderInfo) {
      if (orderInfo.orderNumber) {
        receiptText += `Pedido: #${orderInfo.orderNumber}\n`;
      }
      if (orderInfo.tableName) {
        receiptText += `Mesa: ${orderInfo.tableName}\n`;
      }
      if (orderInfo.customerName) {
        receiptText += `Cliente: ${orderInfo.customerName}\n`;
      }
      receiptText += '\n';
    }
    
    receiptText += '--- ITENS ---\n\n';
    
    // Add items
    for (const item of items) {
      receiptText += `${item.quantity}x ${item.name}\n`;
      
      // Add extras if they exist
      if (item.extras && item.extras.length > 0) {
        for (const extra of item.extras) {
          receiptText += `  + ${extra.name}\n`;
        }
      }
      
      // Add observation if it exists
      if (item.observation) {
        receiptText += `  OBS: ${item.observation}\n`;
      }
      
      receiptText += '\n';
    }
    
    // Add footer
    const now = new Date();
    const dateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    receiptText += `\nImpresso em: ${dateTime}\n`;
    receiptText += '=== FIM PEDIDO ===\n\n\n\n\n';
    
    // Send to printer
    const printRequest: PrintRequest = {
      printerName,
      text: receiptText,
      options: NORMAL_OPTIONS
    };
    
    return await sendPrintRequest(printRequest);
  } catch (error) {
    console.error('Erro ao formatar e imprimir pedido:', error);
    throw error;
  }
};

/**
 * Print multiple orders to multiple printers
 */
export const printOrderItemsToMultiplePrinters = async (
  printerNames: string[],
  items: OrderItem[],
  orderInfo?: {
    orderNumber?: string;
    tableName?: string;
    customerName?: string;
  }
): Promise<boolean[]> => {
  try {
    const printPromises = printerNames.map(printerName => 
      printOrderItems(printerName, items, orderInfo)
    );
    
    return await Promise.all(printPromises);
  } catch (error) {
    console.error('Erro ao imprimir para múltiplas impressoras:', error);
    throw error;
  }
};
