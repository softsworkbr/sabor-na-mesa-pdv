
export interface PrinterConfig {
  id: string;
  restaurant_id: string;
  windows_printer_name: string;
  display_name: string;
  endpoint?: string | null;
  ip_address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePrinterConfigProps {
  restaurant_id: string;
  windows_printer_name: string;
  display_name: string;
  endpoint?: string | null;
  ip_address?: string | null;
}
