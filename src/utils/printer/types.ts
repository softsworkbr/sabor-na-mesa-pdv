export interface PrinterOptions {
  align?: 'left' | 'center' | 'right';
  font?: 'A' | 'B';
  doubleSize?: boolean;
  bold?: boolean;
  beep?: boolean;
}

export interface QRCodeOptions {
  content: string;
  size?: number;
  position?: 'left' | 'center' | 'right';
}

export interface LogoOptions {
  path?: string;
  url?: string;
  base64?: string;
  width?: number;
}

export interface PrintRequest {
  printerName: string;
  text: string;
  options?: PrinterOptions;
  qrcode?: QRCodeOptions;
  logo?: LogoOptions;
  printerId?: string; // ID da configuração da impressora no banco de dados
}

export interface PrintResponse {
  success: boolean;
  error?: string;
}

export enum PrinterType {
  COUNTER = 'Balcão',  // Balcão
  KITCHEN = 'Cozinha',  // Cozinha
  BAR = 'Bar',          // Bar
  OTHER = 'Outro'       // Outro
}

// Interface compatível com a estrutura do banco de dados
export interface PrinterConfig {
  id?: string;
  restaurant_id: string;
  windows_printer_name: string;
  display_name: string;
  endpoint?: string | null;
  ip_address?: string | null;
  created_at?: string;
  updated_at?: string;
  
  // Campos adicionais para compatibilidade com a nova implementação
  type?: PrinterType;
  isDefault?: boolean;
}

export interface PrinterServerStatus {
  status: 'online' | 'offline';
}
