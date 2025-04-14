
export interface PrinterOptions {
  align?: 'left' | 'center' | 'right';
  font?: 'A' | 'B';
  doubleSize?: boolean;
  bold?: boolean;
  beep?: boolean;
}

export interface PrintRequest {
  printerName: string;
  text: string;
  options: PrinterOptions;
}
