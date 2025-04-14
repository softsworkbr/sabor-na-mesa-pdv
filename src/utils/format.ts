
/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param value Valor a ser formatado
 * @returns String formatada no padrão R$ 0,00
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Remove a formatação de moeda de uma string e retorna o valor numérico
 * @param formattedValue String formatada (ex: "R$ 10,50")
 * @returns Valor numérico (ex: 10.5)
 */
export const parseCurrency = (formattedValue: string): number => {
  // Remove o símbolo da moeda, pontos de milhar e substitui vírgula por ponto
  const numericString = formattedValue
    .replace(/[^\d,]/g, '')
    .replace(',', '.');
  
  return parseFloat(numericString) || 0;
};
