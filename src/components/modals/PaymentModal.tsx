import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, DollarSign, CreditCard as CreditCardIcon, Smartphone } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Função para formatação de moeda (R$)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export type PaymentMethod = {
  id: string;
  name: string;
  value: number;
  icon: React.ReactNode;
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

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "cash",
    name: "Dinheiro",
    value: 0,
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    id: "credit",
    name: "Cartão de Crédito",
    value: 0,
    icon: <CreditCardIcon className="h-4 w-4" />,
  },
  {
    id: "debit",
    name: "Cartão de Débito",
    value: 0,
    icon: <CreditCardIcon className="h-4 w-4" />,
  },
  {
    id: "pix",
    name: "PIX",
    value: 0,
    icon: <Smartphone className="h-4 w-4" />,
  },
];

const PaymentModal: React.FC<PaymentModalProps> = ({
  showModal,
  onClose,
  onComplete,
  totalAmount,
  serviceFee,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [cashAmount, setCashAmount] = useState<string>("");
  const [showCashChange, setShowCashChange] = useState(false);

  // Calcular o total com ou sem taxa de serviço
  const effectiveTotal = includeServiceFee ? totalAmount : totalAmount - serviceFee;
  
  // Calcular o total já pago
  const totalPaid = paymentItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Calcular o valor restante a ser pago
  const remainingAmount = Math.max(0, effectiveTotal - totalPaid);
  
  // Calcular o troco (apenas para pagamento em dinheiro)
  const cashPayment = paymentItems.find(item => item.method.id === "cash");
  const cashChange = cashPayment && parseFloat(cashAmount) > 0 
    ? Math.max(0, parseFloat(cashAmount) - remainingAmount)
    : 0;

  useEffect(() => {
    if (showModal) {
      // Reset state when modal opens
      setPaymentItems([]);
      setSelectedPaymentMethod(null);
      setPaymentAmount("");
      setIncludeServiceFee(true);
      setCashAmount("");
      setShowCashChange(false);
    }
  }, [showModal]);

  useEffect(() => {
    // Auto-fill remaining amount when selecting a payment method
    if (selectedPaymentMethod) {
      setPaymentAmount(remainingAmount.toFixed(2));
    }
  }, [selectedPaymentMethod, remainingAmount]);

  const handleAddPayment = () => {
    if (!selectedPaymentMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

    const amount = Math.min(parseFloat(paymentAmount), remainingAmount);
    
    // Check if this payment method already exists
    const existingIndex = paymentItems.findIndex(
      item => item.method.id === selectedPaymentMethod.id
    );

    if (existingIndex >= 0) {
      // Update existing payment
      const updatedItems = [...paymentItems];
      updatedItems[existingIndex].amount += amount;
      setPaymentItems(updatedItems);
    } else {
      // Add new payment
      setPaymentItems([
        ...paymentItems,
        {
          method: selectedPaymentMethod,
          amount,
        },
      ]);
    }

    // If cash payment, show change calculation
    if (selectedPaymentMethod.id === "cash") {
      setCashAmount(paymentAmount);
      setShowCashChange(true);
    }

    // Reset selection
    setSelectedPaymentMethod(null);
    setPaymentAmount("");
  };

  const handleRemovePayment = (index: number) => {
    const newItems = [...paymentItems];
    
    // If removing cash payment, hide change calculation
    if (newItems[index].method.id === "cash") {
      setShowCashChange(false);
      setCashAmount("");
    }
    
    newItems.splice(index, 1);
    setPaymentItems(newItems);
  };

  const handleCompletePayment = () => {
    // Only complete if total is fully paid
    if (totalPaid >= effectiveTotal) {
      onComplete(paymentItems, includeServiceFee);
    }
  };

  const isPaymentComplete = totalPaid >= effectiveTotal;

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold">Pagamento</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between mb-1">
              <span>Subtotal:</span>
              <span>{formatCurrency(totalAmount - serviceFee)}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="includeService" 
                  checked={includeServiceFee} 
                  onCheckedChange={(checked) => setIncludeServiceFee(checked as boolean)}
                />
                <label htmlFor="includeService" className="text-sm">Taxa de serviço (10%)</label>
              </div>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total a pagar:</span>
              <span>{formatCurrency(effectiveTotal)}</span>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="font-medium">Formas de Pagamento</h3>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <Button
                  key={method.id}
                  variant={selectedPaymentMethod?.id === method.id ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setSelectedPaymentMethod(method)}
                  disabled={remainingAmount <= 0}
                >
                  {method.icon}
                  <span className="ml-2">{method.name}</span>
                </Button>
              ))}
            </div>
            
            {selectedPaymentMethod && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Valor"
                    min="0"
                    max={remainingAmount.toString()}
                    step="0.01"
                  />
                </div>
                <Button 
                  onClick={handleAddPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Payment Items */}
          {paymentItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Pagamentos Adicionados</h3>
              <div className="space-y-2">
                {paymentItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <div className="flex items-center">
                      {item.method.icon}
                      <span className="ml-2">{item.method.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 font-medium">{formatCurrency(item.amount)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => handleRemovePayment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between pt-2 border-t">
                <span>Total pago:</span>
                <span className="font-medium">{formatCurrency(totalPaid)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Restante:</span>
                <span className={`font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
              
              {showCashChange && cashChange > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Troco:</span>
                  <span>{formatCurrency(cashChange)}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:justify-end gap-2 mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="md:order-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCompletePayment}
            className="md:order-2"
            disabled={!isPaymentComplete}
          >
            {isPaymentComplete ? "Finalizar Pagamento" : `Falta ${formatCurrency(remainingAmount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
