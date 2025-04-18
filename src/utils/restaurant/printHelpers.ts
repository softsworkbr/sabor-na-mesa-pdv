import { Order, OrderItem } from "@/utils/restaurant/orderTypes";

// Helper function to format monetary values with proper alignment
function formatMoneyValue(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// Helper function to format text with proper alignment using tabs
function formatLine(leftText: string, rightText: string, PRICE_COLUMN_START = 20): string {
  if (leftText.length > PRICE_COLUMN_START - 2) {
    const lines: string[] = [];
    let currentLine = leftText;
    while (currentLine.length > PRICE_COLUMN_START - 2) {
      const cutPoint = PRICE_COLUMN_START - 2;
      lines.push(currentLine.substring(0, cutPoint));
      currentLine = currentLine.substring(cutPoint);
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    let result = `${lines[0]}\t      ${rightText}\n`;
    for (let i = 1; i < lines.length; i++) {
      result += lines[i] + '\n';
    }
    return result.trimEnd();
  }
  return `${leftText}\t\t      ${rightText}`;
}

// Main function to generate print text for the order
export function generatePrintText(order: Order, items: OrderItem[], table: any) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const PRICE_COLUMN_START = 20;

  const customerName = order.customer_name || '';
  let text = "";

  text += "=================================\n";
  text += "               PEDIDO PARA COZINHA \n";
  text += `                 Pedido #${order.id?.substring(0, 8) || ''} \n`;
  text += "=================================\n";
  text += `Data: ${dateStr} ${timeStr}            Mesa: ${table?.number || '-'}\n\n`;

  if (customerName) {
    text += `Cliente: ${customerName}\n\n`;
  }

  text += "ITENS DO PEDIDO:\n";
  text += "---------------------------------------------------------\n";

  items.forEach(item => {
    // O preço salvo já inclui variação e extras. Para exibir extras individualmente, subtrai do preço base.
    let extrasTotal = 0;
    if (item.extras && item.extras.length > 0) {
      extrasTotal = item.extras.reduce((sum, extra) => sum + (extra.price * item.quantity), 0);
    }
    // Valor base do item (sem extras)
    const baseItemPrice = (item.price * item.quantity) - extrasTotal;
    const itemText = `${item.quantity}x ${item.name}`;
    const priceText = formatMoneyValue(baseItemPrice);
    text += formatLine(itemText, priceText, PRICE_COLUMN_START) + '\n';

    if (item.extras && item.extras.length > 0) {
      item.extras.forEach(extra => {
        const extraText = `+ ${extra.name}`;
        const extraPriceText = formatMoneyValue(extra.price * item.quantity);
        text += formatLine(`   ${extraText}`, extraPriceText, PRICE_COLUMN_START) + '\n';
      });
    }

    if (item.observation) {
      const obsText = `OBS: ${item.observation}`;
      text += formatLine(`   ${obsText}`, '', PRICE_COLUMN_START) + '\n';
    }

    text += "\n";
  });

  text += "---------------------------------------------------------\n";

  if (order.customer_name) {
    text += `Obs: Cliente ${order.customer_name}\n`;
  }

  // Subtotal correto: soma dos itens já com extras embutidos
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  text += "\n";

  const subtotalText = "SUBTOTAL:";
  const subtotalPriceText = formatMoneyValue(subtotal);
  text += formatLine(subtotalText, subtotalPriceText, PRICE_COLUMN_START) + '\n';

  if (order.service_fee && order.service_fee > 0) {
    const serviceFeeText = "TAXA DE SERVIÇO (10%):";
    const serviceFeePriceText = formatMoneyValue(order.service_fee);
    text += formatLine(serviceFeeText, serviceFeePriceText, PRICE_COLUMN_START) + '\n';

    const totalText = "TOTAL:";
    const totalPriceText = formatMoneyValue(subtotal + order.service_fee);
    text += formatLine(totalText, totalPriceText, PRICE_COLUMN_START) + '\n';
  }

  text += "=================================\n";

  return text;
}
