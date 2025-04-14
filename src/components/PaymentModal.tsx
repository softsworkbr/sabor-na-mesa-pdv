
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Wallet, 
  DollarSign, 
  Smartphone, 
  Check, 
  X, 
  Trash2,
  AlertCircle,
  BadgeDollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Order, PaymentMethod, Payment, PaymentSummary } from "@/utils/restaurant/orderTypes";
import { supabase } from "@/integrations/supabase/client";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onPaymentComplete?: (paymentSummary: PaymentSummary) => void;
}

const PaymentModal = ({ isOpen, onClose, order, onPaymentComplete }: PaymentModalProps) => {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  
  const totalAmount = (order?.total_amount || 0) + (order?.service_fee || 0);
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const change = activeMethod === 'cash' && Number(cashAmount) > Number(paymentAmount) 
    ? Number(cashAmount) - Number(paymentAmount) 
    : 0;

  useEffect(() => {
    if (isOpen && order) {
      // Reset state when opening modal
      setActiveMethod('cash');
      setPaymentAmount(remainingAmount.toString());
      setCashAmount('');
      setPayments([]);
      
      // Load existing payments if any
      if (order.payments && order.payments.length > 0) {
        setPayments(order.payments);
      }
    }
  }, [isOpen, order]);
  
  useEffect(() => {
    // Update payment amount to remaining amount when it changes
    setPaymentAmount(remainingAmount.toFixed(2));
  }, [remainingAmount]);

  const handleAddPayment = () => {
    const amount = Number(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido");
      return;
    }
    
    if (amount > remainingAmount) {
      toast.error(`O valor não pode ser maior que o valor restante (R$ ${remainingAmount.toFixed(2)})`);
      return;
    }
    
    const newPayment: Payment = {
      order_id: order?.id || '',
      method: activeMethod,
      amount,
      provided_amount: activeMethod === 'cash' && cashAmount ? Number(cashAmount) : undefined
    };
    
    setPayments([...payments, newPayment]);
    
    // Reset fields
    setPaymentAmount(Math.max(0, remainingAmount - amount).toFixed(2));
    setCashAmount('');
    
    toast.success(`Pagamento de R$ ${amount.toFixed(2)} adicionado`);
  };
  
  const handleRemovePayment = (index: number) => {
    const removedPayment = payments[index];
    
    const updatedPayments = payments.filter((_, i) => i !== index);
    setPayments(updatedPayments);
    
    // Adjust remaining amount
    setPaymentAmount((prev) => (Number(prev) + removedPayment.amount).toFixed(2));
    
    toast.success("Pagamento removido");
  };
  
  const handleSavePayments = async () => {
    if (!order?.id) return;
    
    if (remainingAmount > 0) {
      toast.error(`Ainda falta R$ ${remainingAmount.toFixed(2)} para completar o pagamento`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Save payments to database
      for (const payment of payments) {
        if (!payment.id) { // Only save new payments
          await supabase
            .from('payments')
            .insert({
              order_id: order.id,
              method: payment.method,
              amount: payment.amount,
              provided_amount: payment.provided_amount
            });
        }
      }
      
      // Update order status to completed
      await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id);
      
      toast.success("Pagamento concluído com sucesso!");
      
      // Collect payment summary for callback
      const paymentSummary: PaymentSummary = {
        total: totalAmount,
        paid: paidAmount,
        remaining: remainingAmount,
        methods: payments.map(p => ({ method: p.method, amount: p.amount }))
      };
      
      if (onPaymentComplete) {
        onPaymentComplete(paymentSummary);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving payments:", error);
      toast.error("Erro ao salvar pagamentos");
    } finally {
      setLoading(false);
    }
  };
  
  if (!order) return null;
  
  const PaymentMethodIcon = ({ method }: { method: PaymentMethod }) => {
    switch (method) {
      case 'cash':
        return <Wallet className="h-5 w-5" />;
      case 'credit':
        return <CreditCard className="h-5 w-5" />;
      case 'debit':
        return <BadgeDollarSign className="h-5 w-5" />;
      case 'pix':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };
  
  const getMethodName = (method: PaymentMethod): string => {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'credit': return 'Crédito';
      case 'debit': return 'Débito';
      case 'pix': return 'PIX';
      default: return 'Outro';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Order summary */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>R$ {(order.total_amount || 0).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Taxa de serviço:</span>
              <span>R$ {(order.service_fee || 0).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          
          {/* Payment methods selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Forma de Pagamento</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['cash', 'credit', 'debit', 'pix'] as PaymentMethod[]).map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={activeMethod === method ? "default" : "outline"}
                  className={cn(
                    "flex flex-col h-auto py-3 gap-1",
                    activeMethod === method ? "border-primary" : ""
                  )}
                  onClick={() => {
                    setActiveMethod(method);
                    // Reset cash amount when switching methods
                    if (method !== 'cash') {
                      setCashAmount('');
                    }
                  }}
                >
                  <PaymentMethodIcon method={method} />
                  <span className="text-xs">{getMethodName(method)}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Payment amount and cash handling */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor a Pagar</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="text-right"
              />
              <p className="text-xs text-muted-foreground">
                Valor restante: R$ {remainingAmount.toFixed(2).replace('.', ',')}
              </p>
            </div>
            
            {activeMethod === 'cash' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Recebido</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="text-right"
                />
                {Number(cashAmount) > Number(paymentAmount) && (
                  <p className="text-sm font-medium text-green-600">
                    Troco: R$ {change.toFixed(2).replace('.', ',')}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Add payment button */}
          <Button
            onClick={handleAddPayment}
            className="w-full"
            disabled={!paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > remainingAmount}
          >
            Adicionar Pagamento
          </Button>
          
          {/* List of added payments */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Pagamentos Adicionados</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {payments.map((payment, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between bg-muted p-2 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <PaymentMethodIcon method={payment.method} />
                      <span>{getMethodName(payment.method)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        R$ {payment.amount.toFixed(2).replace('.', ',')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleRemovePayment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total Pago:</span>
                <span className="font-bold">
                  R$ {paidAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
              {remainingAmount > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Falta R$ {remainingAmount.toFixed(2).replace('.', ',')} para completar o pagamento
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSavePayments}
            className="w-full sm:w-auto"
            disabled={remainingAmount > 0 || payments.length === 0 || loading}
          >
            {loading ? 'Processando...' : 'Concluir Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
