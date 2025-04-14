// refatorado para separar lógica e facilitar manutenção futura
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, DollarSign, CreditCard as CreditCardIcon, Smartphone } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/format";
import { getPaymentMethods } from "@/utils/restaurant/orderManagement";
import { PaymentMethod as PaymentMethodType } from "@/utils/restaurant/orderTypes";
import { toast } from "sonner";

export type PaymentMethod = {
  id: string;
  name: string;
  value: number;
  icon: React.ReactNode;
  code: string;
};

export type PaymentItem = {
  method: PaymentMethod;
  amount: number;
};

interface PaymentModalProps {
  showModal: boolean;
  onClose: () => void;
  onComplete: (payments: PaymentItem[], includeServiceFee: boolean) => void;
  totalAmount: number;
  serviceFee: number;
}

const getPaymentIcon = (code: string) => {
  switch (code) {
    case 'cash': return <DollarSign className="h-4 w-4" />;
    case 'pix': return <Smartphone className="h-4 w-4" />;
    case 'credit':
    case 'debit':
    default: return <CreditCardIcon className="h-4 w-4" />;
  }
};

const PaymentModal: React.FC<PaymentModalProps> = ({ showModal, onClose, onComplete, totalAmount, serviceFee }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trocoValue, setTrocoValue] = useState<number>(0);

  // Valores calculados em tempo real
  const effectiveTotal = includeServiceFee ? totalAmount : totalAmount - serviceFee;
  const totalPaid = paymentItems.reduce((sum, item) => sum + item.amount, 0);
  const remainingAmount = Math.max(0, effectiveTotal - totalPaid);
  const isPaymentComplete = totalPaid >= effectiveTotal;

  // Log dos itens de pagamento para depuração
  useEffect(() => {
    console.log("=== PAGAMENTOS ATUAIS ===");
    paymentItems.forEach((item, index) => {
      console.log(`Pagamento #${index + 1}:`);
      console.log(`- Método: ${item.method.name}`);
      console.log(`- ID do método: "${item.method.id}"`);
      console.log(`- Código do método: "${item.method.code}"`);
      console.log(`- Valor: ${item.amount}`);
    });
    console.log("Total pago:", totalPaid);
    console.log("Restante:", remainingAmount);
  }, [paymentItems, totalPaid, remainingAmount]);

  // Valores temporários para preview em tempo real
  const previewAmount = selectedMethod && paymentAmount && !isNaN(parseFloat(paymentAmount)) 
    ? Math.min(parseFloat(paymentAmount), remainingAmount) 
    : 0;
  
  const previewTotalPaid = totalPaid + previewAmount;
  const previewRemainingAmount = Math.max(0, effectiveTotal - previewTotalPaid);
  
  // Calcular troco em tempo real para o preview
  const cashPaymentTotal = paymentItems
    .filter(item => {
      console.log(`Verificando se ${item.method.name} (ID: "${item.method.id}", Código: "${item.method.code}") é pagamento em dinheiro`);
      return item.method.code === 'cash';
    })
    .reduce((sum, item) => sum + item.amount, 0);
  
  console.log("Total em dinheiro:", cashPaymentTotal);
  
  // Se o método selecionado for dinheiro, considerar o valor digitado no campo de pagamento
  const previewCashPaymentTotal = selectedMethod?.code === 'cash' 
    ? cashPaymentTotal + previewAmount 
    : cashPaymentTotal;
  
  // Usar o valor digitado no campo de pagamento se for dinheiro
  const receivedCash = selectedMethod?.code === 'cash' && paymentAmount
    ? parseFloat(paymentAmount) || 0
    : parseFloat(cashReceived) || 0;
    
  console.log("Valor recebido em dinheiro:", receivedCash);
  console.log("Valor digitado no campo de pagamento:", paymentAmount);
  
  // Calcular troco mesmo quando não há pagamentos em dinheiro ainda
  // mas o usuário já digitou um valor no campo de dinheiro recebido
  let previewTrocoValue = 0;
  
  if (selectedMethod?.code === 'cash' && paymentAmount && parseFloat(paymentAmount) > 0) {
    // Se estiver selecionando dinheiro, calcular troco com base no valor digitado
    const paymentValue = parseFloat(paymentAmount);
    if (paymentValue > remainingAmount) {
      previewTrocoValue = paymentValue - remainingAmount;
      console.log(`Troco previsto (digitando): ${paymentValue} - ${remainingAmount} = ${previewTrocoValue}`);
    }
  } else if (receivedCash > 0) {
    // Se já tiver um valor no campo de dinheiro recebido
    const baseValue = previewCashPaymentTotal > 0 ? previewCashPaymentTotal : remainingAmount;
    if (receivedCash > baseValue) {
      previewTrocoValue = receivedCash - baseValue;
      console.log(`Troco previsto (recebido): ${receivedCash} - ${baseValue} = ${previewTrocoValue}`);
    }
  }
  
  console.log("Troco previsto final:", previewTrocoValue);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setIsLoading(true);
        const methods = await getPaymentMethods();
        const formattedMethods = methods.map(m => ({ ...m, icon: getPaymentIcon(m.code), value: 0 }));
        console.log("Métodos de pagamento carregados:", formattedMethods);
        formattedMethods.forEach(method => {
          console.log(`- Método: ${method.name}, ID: "${method.id}", Código: "${method.code}"`);
        });
        setAvailableMethods(formattedMethods);
      } catch (e) {
        toast.error("Erro ao carregar métodos. Usando padrão.");
        const defaultMethods = [
          { id: "cash", name: "Dinheiro", value: 0, code: "cash", icon: <DollarSign className="h-4 w-4" /> },
          { id: "credit", name: "Crédito", value: 0, code: "credit", icon: <CreditCardIcon className="h-4 w-4" /> },
          { id: "debit", name: "Débito", value: 0, code: "debit", icon: <CreditCardIcon className="h-4 w-4" /> },
          { id: "pix", name: "PIX", value: 0, code: "pix", icon: <Smartphone className="h-4 w-4" /> }
        ];
        console.log("Usando métodos de pagamento padrão:", defaultMethods);
        setAvailableMethods(defaultMethods);
      } finally {
        setIsLoading(false);
      }
    };
    if (showModal) fetchMethods();
  }, [showModal]);

  useEffect(() => {
    if (showModal) {
      setSelectedMethod(null);
      setPaymentAmount("");
      setPaymentItems([]);
      setIncludeServiceFee(true);
      setCashReceived("");
      setTrocoValue(0);
    }
  }, [showModal]);

  useEffect(() => {
    if (selectedMethod) {
      // Preencher com o valor restante, mas permitir edição
      setPaymentAmount(remainingAmount.toFixed(2));
    }
  }, [selectedMethod, remainingAmount]);

  useEffect(() => {
    // Atualizar o valor do serviço quando o checkbox mudar
    if (paymentItems.length > 0) {
      const newTotal = includeServiceFee ? totalAmount : totalAmount - serviceFee;
      const currentTotal = paymentItems.reduce((sum, item) => sum + item.amount, 0);
      
      console.log("Taxa de serviço alterada:");
      console.log("- Novo total:", newTotal);
      console.log("- Total atual de pagamentos:", currentTotal);
      
      // Não remover pagamentos, apenas notificar o usuário sobre a mudança
      if (includeServiceFee) {
        // Taxa habilitada - valor aumentou
        toast.info(`Taxa de serviço adicionada: +${formatCurrency(serviceFee)}`);
      } else {
        // Taxa desabilitada - valor diminuiu
        toast.info(`Taxa de serviço removida: -${formatCurrency(serviceFee)}`);
      }
      
      // Se o pagamento já estiver completo após a mudança, notificar
      if (currentTotal >= newTotal && !isPaymentComplete) {
        toast.success("Pagamento completo após ajuste da taxa!");
      }
    }
  }, [includeServiceFee, totalAmount, serviceFee, paymentItems, isPaymentComplete]);

  useEffect(() => {
    const cashPayments = paymentItems.filter(i => i.method.code === 'cash');
    const totalCash = cashPayments.reduce((sum, i) => sum + i.amount, 0);
    const received = parseFloat(cashReceived) || 0;
    
    console.log("Verificando troco:");
    console.log("- Total em dinheiro:", totalCash);
    console.log("- Valor recebido:", received);
    
    // Calcular troco mesmo quando não há pagamentos em dinheiro ainda
    if (received > 0) {
      // Se não há pagamentos em dinheiro, considerar o valor total restante
      const baseValue = totalCash > 0 ? totalCash : (selectedMethod?.code === 'cash' ? remainingAmount : 0);
      const change = received > baseValue ? received - baseValue : 0;
      console.log("- Valor base para cálculo:", baseValue);
      console.log("- Troco calculado:", change);
      setTrocoValue(change);
    } else {
      setTrocoValue(0);
    }
  }, [cashReceived, paymentItems, remainingAmount, selectedMethod]);

  const addPayment = () => {
    if (!selectedMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    
    console.log("=== ADICIONANDO PAGAMENTO ===");
    console.log(`Método selecionado: ${selectedMethod.name} (ID: "${selectedMethod.id}", Código: "${selectedMethod.code}")`);
    console.log(`Valor: ${paymentAmount}`);
    
    // Permitir adicionar o valor total restante
    const amount = Math.min(parseFloat(paymentAmount), remainingAmount);
    console.log(`Valor ajustado: ${amount}`);
    
    // Verificar se já existe um pagamento com este método
    const existing = paymentItems.findIndex(i => i.method.code === selectedMethod.code);
    console.log(`Pagamento existente com este método: ${existing >= 0 ? 'Sim' : 'Não'}`);
    
    let updatedItems;
    if (existing >= 0) {
      // Atualizar pagamento existente
      updatedItems = [...paymentItems];
      updatedItems[existing] = {
        ...updatedItems[existing],
        amount: updatedItems[existing].amount + amount
      };
    } else {
      // Adicionar novo pagamento
      updatedItems = [
        ...paymentItems,
        { method: selectedMethod, amount }
      ];
    }
    
    setPaymentItems(updatedItems);
    
    // Se for pagamento em dinheiro, atualizar o valor recebido
    if (selectedMethod.code === 'cash') {
      // Importante: preservar o valor digitado se for maior que o valor do pagamento
      const currentCashValue = parseFloat(cashReceived) || 0;
      const paymentValue = parseFloat(paymentAmount) || 0;
      
      // Usar o maior valor entre o que foi digitado e o valor do pagamento
      if (currentCashValue < paymentValue) {
        setCashReceived(paymentAmount);
      }
      
      // Calcular o troco imediatamente
      const cashPaymentTotal = updatedItems
        .filter(item => item.method.code === 'cash')
        .reduce((sum, item) => sum + item.amount, 0);
      
      const cashValue = Math.max(currentCashValue, paymentValue);
      if (cashValue > cashPaymentTotal) {
        setTrocoValue(cashValue - cashPaymentTotal);
      }
    }
    
    // Limpar seleção
    setSelectedMethod(null);
    setPaymentAmount("");
    
    // Mostrar feedback
    toast.success(`Adicionado ${formatCurrency(amount)} em ${selectedMethod.name}`);
  };

  const removePayment = (index: number) => {
    const updated = [...paymentItems];
    updated.splice(index, 1);
    setPaymentItems(updated);
    if (!updated.some(i => i.method.code === "cash")) {
      setCashReceived("");
    }
  };

  const completePayment = () => {
    if (isPaymentComplete) onComplete(paymentItems, includeServiceFee);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Pagamento</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between mb-1">
              <span>Subtotal:</span><span>{formatCurrency(totalAmount - serviceFee)}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="includeService" 
                  checked={includeServiceFee} 
                  onCheckedChange={(checked) => {
                    setIncludeServiceFee(!!checked);
                    console.log("Taxa de serviço:", checked ? "habilitada" : "desabilitada");
                  }}
                />
                <label htmlFor="includeService" className="text-sm">Taxa de serviço (10%)</label>
              </div>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total a pagar:</span><span>{formatCurrency(effectiveTotal)}</span>
            </div>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando métodos de pagamento...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableMethods.map(method => (
                  <Button key={method.id} variant={selectedMethod?.code === method.code ? "default" : "outline"} onClick={() => setSelectedMethod(method)} disabled={remainingAmount <= 0}>
                    {method.icon}<span className="ml-2">{method.name}</span>
                  </Button>
                ))}
              </div>
            )}

            {selectedMethod && (
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <Input 
                    id="paymentAmount" 
                    type="text" 
                    value={paymentAmount} 
                    onChange={(e) => {
                      // Aceitar apenas números e ponto/vírgula
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      // Substituir vírgula por ponto para cálculos
                      const normalizedValue = value.replace(',', '.');
                      setPaymentAmount(normalizedValue);
                    }} 
                    placeholder="Valor" 
                    className="flex-1" 
                  />
                  <Button 
                    onClick={addPayment} 
                    size="icon" 
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Preview em tempo real */}
                {paymentAmount && !isNaN(parseFloat(paymentAmount)) && parseFloat(paymentAmount) > 0 && (
                  <div className="bg-gray-50 p-2 rounded-md text-sm">
                    <div className="flex justify-between">
                      <span>Total atual:</span><span>{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ {selectedMethod.name}:</span><span>{formatCurrency(previewAmount)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>= Total após pagamento:</span><span>{formatCurrency(previewTotalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restante após:</span>
                      <span className={previewRemainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(previewRemainingAmount)}
                      </span>
                    </div>
                    
                    {/* Preview do troco */}
                    {selectedMethod.code === 'cash' && (
                      <div className="flex justify-between mt-1 pt-1 border-t border-gray-200">
                        <span>Troco previsto:</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(
                            parseFloat(paymentAmount) > remainingAmount 
                              ? parseFloat(paymentAmount) - remainingAmount 
                              : 0
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {paymentItems.length > 0 && (
            <div className="space-y-2">
              {paymentItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <div className="flex items-center">{item.method.icon}<span className="ml-2">{item.method.name}</span></div>
                  <div className="flex items-center">
                    <span className="mr-2 font-medium">{formatCurrency(item.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removePayment(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {paymentItems.some(p => p.method.code === 'cash') && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <label htmlFor="cash" className="text-sm font-medium">Valor recebido em dinheiro</label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setCashReceived("50")} className="text-xs h-6">R$ 50</Button>
                      <Button variant="outline" size="sm" onClick={() => setCashReceived("100")} className="text-xs h-6">R$ 100</Button>
                      <Button variant="outline" size="sm" onClick={() => setCashReceived("200")} className="text-xs h-6">R$ 200</Button>
                    </div>
                  </div>
                  <Input 
                    id="cash" 
                    type="text" 
                    value={cashReceived} 
                    onChange={(e) => {
                      // Aceitar apenas números e ponto/vírgula
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      // Substituir vírgula por ponto para cálculos
                      const normalizedValue = value.replace(',', '.');
                      setCashReceived(normalizedValue);
                      console.log("Valor em dinheiro atualizado:", normalizedValue);
                      
                      // Adicionar cálculo imediato do troco
                      const cashValue = parseFloat(normalizedValue) || 0;
                      if (cashValue > 0) {
                        const cashPaymentTotal = paymentItems
                          .filter(item => item.method.code === 'cash')
                          .reduce((sum, item) => sum + item.amount, 0);
                        
                        // Se não há pagamentos em dinheiro, considerar o valor total restante
                        const baseValue = cashPaymentTotal > 0 ? cashPaymentTotal : remainingAmount;
                        if (cashValue > baseValue) {
                          setTrocoValue(cashValue - baseValue);
                        } else {
                          setTrocoValue(0);
                        }
                      }
                    }} 
                    placeholder="Valor recebido" 
                    className="text-lg mt-2" 
                  />
                  <div className="flex justify-between text-green-600 font-bold mt-2 bg-green-50 p-2 rounded">
                    <span>Troco:</span><span>{formatCurrency(trocoValue)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span>Total pago:</span><span className="font-medium">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Restante:</span><span className={`font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={completePayment} disabled={!isPaymentComplete}>{isPaymentComplete ? "Finalizar Pagamento" : `Falta ${formatCurrency(remainingAmount)}`}</Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
