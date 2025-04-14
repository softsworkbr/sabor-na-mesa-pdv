
import React, { useState, useEffect } from "react";
import { X, Banknote, QrCode, CreditCard, Receipt, Ticket, Trash2, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface PaymentEntry {
  id: string;
  methodId: string;
  methodName: string;
  amount: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onCompletePayment: (payments: PaymentEntry[]) => void;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "cash",
    name: "Dinheiro",
    icon: <Banknote className="h-5 w-5" />,
    color: "bg-green-100 text-green-700 border-green-300"
  },
  {
    id: "pix",
    name: "PIX",
    icon: <QrCode className="h-5 w-5" />,
    color: "bg-blue-100 text-blue-700 border-blue-300"
  },
  {
    id: "credit",
    name: "Cartão de Crédito",
    icon: <CreditCard className="h-5 w-5" />,
    color: "bg-indigo-100 text-indigo-700 border-indigo-300"
  },
  {
    id: "debit",
    name: "Cartão de Débito",
    icon: <CreditCard className="h-5 w-5" />,
    color: "bg-purple-100 text-purple-700 border-purple-300"
  },
  {
    id: "meal_voucher",
    name: "Vale Refeição",
    icon: <Ticket className="h-5 w-5" />,
    color: "bg-amber-100 text-amber-700 border-amber-300"
  },
  {
    id: "food_voucher",
    name: "Vale Alimentação",
    icon: <Receipt className="h-5 w-5" />,
    color: "bg-orange-100 text-orange-700 border-orange-300"
  }
];

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total, onCompletePayment }) => {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string | null>(null);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setPayments([]);
      setCurrentPaymentMethod(null);
      setCurrentPaymentAmount("");
      setCashAmount("");
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = Math.max(0, total - totalPaid);
  const isFullyPaid = totalPaid >= total;
  const changeDue = currentPaymentMethod === "cash" && cashAmount ? 
    Math.max(0, parseFloat(cashAmount) - remainingAmount) : 
    Math.max(0, totalPaid - total);

  const handleSelectPaymentMethod = (methodId: string) => {
    setCurrentPaymentMethod(methodId);
    
    // Auto-fill with remaining amount
    if (methodId !== "cash") {
      setCurrentPaymentAmount(remainingAmount.toFixed(2));
    } else {
      setCurrentPaymentAmount("");
      setCashAmount("");
    }
  };
  
  const handleAddPayment = () => {
    if (!currentPaymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }
    
    let amountToAdd: number;
    
    if (currentPaymentMethod === "cash" && cashAmount) {
      const cashValue = parseFloat(cashAmount);
      if (isNaN(cashValue) || cashValue <= 0) {
        toast.error("Informe um valor válido para o pagamento em dinheiro");
        return;
      }
      
      // For cash, we add the actual payment amount (not the cash given)
      amountToAdd = Math.min(cashValue, remainingAmount);
    } else {
      const amount = parseFloat(currentPaymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Informe um valor válido para o pagamento");
        return;
      }
      
      if (amount > remainingAmount) {
        toast.error(`O valor não pode exceder o restante (R$ ${remainingAmount.toFixed(2).replace('.', ',')})`);
        return;
      }
      
      amountToAdd = amount;
    }
    
    const method = paymentMethods.find(m => m.id === currentPaymentMethod);
    if (!method) return;
    
    setPayments([
      ...payments, 
      { 
        id: Date.now().toString(),
        methodId: method.id, 
        methodName: method.name,
        amount: amountToAdd 
      }
    ]);
    
    setCurrentPaymentMethod(null);
    setCurrentPaymentAmount("");
    setCashAmount("");
  };
  
  const handleRemovePayment = (paymentId: string) => {
    setPayments(payments.filter(p => p.id !== paymentId));
  };
  
  const handleCompletePayment = () => {
    if (totalPaid < total) {
      toast.error("O valor total ainda não foi pago");
      return;
    }
    
    onCompletePayment(payments);
    onClose();
    
    toast.success(`Pagamento de R$ ${total.toFixed(2).replace('.', ',')} concluído com sucesso!`);
    if (changeDue > 0) {
      toast.success(`Troco: R$ ${changeDue.toFixed(2).replace('.', ',')}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-4 md:p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold">Formas de Pagamento</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total do pedido:</span>
            <span className="font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
          
          {payments.length > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total pago:</span>
                <span className="font-semibold text-blue-600">R$ {totalPaid.toFixed(2).replace('.', ',')}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Restante:</span>
                <span className={`font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  R$ {remainingAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              {changeDue > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium text-green-600">Troco:</span>
                  <span className="font-semibold text-green-600">R$ {changeDue.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Pagamentos adicionados:</h3>
          {payments.length > 0 ? (
            <div className="space-y-2 max-h-[30vh] overflow-y-auto">
              {payments.map((payment) => {
                const method = paymentMethods.find(m => m.id === payment.methodId);
                return (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div className="flex items-center">
                      <div className={cn("p-1.5 rounded-md mr-2", method?.color.split(' ')[0])}>
                        {method?.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{payment.methodName}</div>
                        <div className="text-xs text-gray-500">
                          {payment.methodId === "cash" && changeDue > 0 
                            ? `R$ ${(payment.amount + changeDue).toFixed(2).replace('.', ',')} (Valor pago)`
                            : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold mr-3">
                        R$ {payment.amount.toFixed(2).replace('.', ',')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500"
                        onClick={() => handleRemovePayment(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2 text-sm text-gray-500">
              Nenhum pagamento adicionado
            </div>
          )}
        </div>
        
        {!isFullyPaid && (
          <>
            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">Adicionar pagamento:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      "border rounded-md p-2 flex flex-col items-center cursor-pointer transition-all",
                      currentPaymentMethod === method.id
                        ? "border-primary bg-primary/10"
                        : method.color
                    )}
                    onClick={() => handleSelectPaymentMethod(method.id)}
                  >
                    {method.icon}
                    <span className="text-xs mt-1 text-center">{method.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {currentPaymentMethod && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center">
                  <Badge className={cn("mr-2", paymentMethods.find(m => m.id === currentPaymentMethod)?.color)}>
                    {paymentMethods.find(m => m.id === currentPaymentMethod)?.name}
                  </Badge>
                  <span className="text-sm">
                    {currentPaymentMethod === "cash" 
                      ? "Informe o valor recebido:" 
                      : "Informe o valor do pagamento:"}
                  </span>
                </div>
                
                {currentPaymentMethod === "cash" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Valor recebido:</label>
                      <div className="flex">
                        <div className="flex-shrink-0 bg-gray-100 flex items-center px-3 border border-r-0 rounded-l-md">
                          R$
                        </div>
                        <Input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="rounded-l-none"
                          placeholder="0,00"
                          min={remainingAmount}
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    {parseFloat(cashAmount) > 0 && (
                      <>
                        <div>
                          <label className="text-sm text-gray-500">Valor a ser pago:</label>
                          <div className="flex">
                            <div className="flex-shrink-0 bg-gray-100 flex items-center px-3 border border-r-0 rounded-l-md">
                              R$
                            </div>
                            <Input
                              type="number"
                              value={Math.min(parseFloat(cashAmount), remainingAmount).toFixed(2)}
                              className="rounded-l-none"
                              readOnly
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-500">Troco:</label>
                          <div className="flex">
                            <div className="flex-shrink-0 bg-gray-100 flex items-center px-3 border border-r-0 rounded-l-md">
                              R$
                            </div>
                            <Input
                              type="text"
                              value={Math.max(0, parseFloat(cashAmount) - remainingAmount).toFixed(2).replace('.', ',')}
                              className="rounded-l-none bg-gray-50"
                              readOnly
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex">
                    <div className="flex-shrink-0 bg-gray-100 flex items-center px-3 border border-r-0 rounded-l-md">
                      R$
                    </div>
                    <Input
                      type="number"
                      value={currentPaymentAmount}
                      onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                      className="rounded-l-none"
                      placeholder="0,00"
                      max={remainingAmount}
                      step="0.01"
                    />
                  </div>
                )}
                
                <Button 
                  onClick={handleAddPayment}
                  disabled={
                    (currentPaymentMethod === "cash" && !cashAmount) || 
                    (currentPaymentMethod !== "cash" && !currentPaymentAmount)
                  }
                  className="w-full"
                >
                  Adicionar Pagamento
                </Button>
              </div>
            )}
          </>
        )}
        
        <div className="flex justify-end gap-2 mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCompletePayment} 
            disabled={!isFullyPaid}
            className={isFullyPaid ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Finalizar Pagamento {isFullyPaid && <CornerDownLeft className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
