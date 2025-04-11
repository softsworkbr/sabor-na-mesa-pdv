import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShoppingCart,
  Printer,
  CreditCard,
  Search,
  Plus,
  Minus,
  Trash2,
  MoreHorizontal,
  FileText
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import OrderProduct from "./OrderProduct";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";

type TableStatus = "free" | "occupied" | "active" | "reserved";

interface TableOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    id: number;
    number: number;
    status: TableStatus;
  } | null;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  observation?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  color: string;
  textColor?: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  category: string;
}

const productCategories: ProductCategory[] = [
  { id: "todas", name: "Todas", color: "bg-white", textColor: "text-black" },
  { id: "cervejas", name: "Cervejas", color: "bg-cyan-500", textColor: "text-white" },
  { id: "refrigerantes", name: "Refrigerantes e suco", color: "bg-teal-500", textColor: "text-white" },
  { id: "suco", name: "Suco de jarra", color: "bg-emerald-400", textColor: "text-white" },
  { id: "caipirinha", name: "Caipirinha", color: "bg-lime-400", textColor: "text-black" },
  { id: "saladas", name: "Saladas", color: "bg-amber-400", textColor: "text-black" },
  { id: "file_mignon", name: "Filé Mignon", color: "bg-orange-400", textColor: "text-black" },
  { id: "picanha", name: "Picanha", color: "bg-orange-500", textColor: "text-white" },
  { id: "file_frango", name: "Filé de Frango", color: "bg-rose-500", textColor: "text-white" },
  { id: "file_saint", name: "Filé de Saint Peter", color: "bg-pink-700", textColor: "text-white" },
  { id: "massas", name: "Massas", color: "bg-purple-600", textColor: "text-white" },
  { id: "pratos_kids", name: "Pratos kids", color: "bg-blue-400", textColor: "text-white" },
  { id: "lanche_file", name: "Lanche de Filé Mignon", color: "bg-slate-600", textColor: "text-white" },
  { id: "lanche_frango", name: "Lanche de Frango", color: "bg-teal-600", textColor: "text-white" },
  { id: "lanche_hamburger", name: "Lanche de hambúrguer", color: "bg-emerald-800", textColor: "text-white" },
  { id: "lanches_especiais", name: "Lanches especiais", color: "bg-lime-300", textColor: "text-black" },
  { id: "outros", name: "Outros", color: "bg-yellow-400", textColor: "text-black" },
];

const sampleProducts: Product[] = [
  { id: "1", code: "1", name: "Heineken zero", price: 9.50, category: "cervejas" },
  { id: "2", code: "2", name: "Brahma 600ml", price: 9.90, category: "cervejas" },
  { id: "3", code: "4", name: "Original 600ml", price: 12.50, category: "cervejas" },
  { id: "4", code: "5", name: "Serramalte 600ml", price: 12.50, category: "cervejas" },
  { id: "5", code: "9", name: "Budweiser long", price: 9.50, category: "cervejas" },
  { id: "6", code: "221", name: "cabare", price: 9.90, category: "cervejas" },
  { id: "7", code: "129", name: "heineken 600", price: 15.00, category: "cervejas" },
  { id: "8", code: "8", name: "Heineken long", price: 9.50, category: "cervejas" },
  { id: "9", code: "10", name: "Malzbier", price: 9.50, category: "cervejas" },
  { id: "10", code: "0", name: "originalzinha", price: 8.00, category: "cervejas" },
  { id: "11", code: "11", name: "Coca-Cola 600ml", price: 7.50, category: "refrigerantes" },
  { id: "12", code: "12", name: "Guaraná Antarctica", price: 7.50, category: "refrigerantes" },
  { id: "13", code: "13", name: "Suco de Laranja", price: 9.00, category: "suco" },
  { id: "14", code: "14", name: "Caipirinha de Limão", price: 15.00, category: "caipirinha" },
  { id: "15", code: "15", name: "Salada Caesar", price: 25.00, category: "saladas" },
];

const TableOrderDrawer = ({ isOpen, onClose, table }: TableOrderDrawerProps) => {
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStep, setCurrentStep] = useState<"order" | "products">("order");
  const [activeCategory, setActiveCategory] = useState("todas");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [observation, setObservation] = useState("");
  const [showObservationModal, setShowObservationModal] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleAddProduct = (productId: string, withObservation: boolean = false) => {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;

    if (withObservation) {
      setSelectedProduct(product);
      setObservation("");
      setShowObservationModal(true);
      return;
    }

    const existingItem = orderItems.find(item => item.id === productId);

    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`Quantidade de "${product.name}" aumentada.`);
    } else {
      setOrderItems([...orderItems, {
        id: product.id,
        name: product.name,
        quantity: 1,
        price: product.price
      }]);
      toast.success(`"${product.name}" adicionado ao pedido.`);
    }
  };

  const handleAddProductWithObservation = () => {
    if (!selectedProduct) return;

    const existingItem = orderItems.find(item => item.id === selectedProduct.id && item.observation === observation);

    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.id === selectedProduct.id && item.observation === observation
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`Quantidade de "${selectedProduct.name}" aumentada.`);
    } else {
      setOrderItems([...orderItems, {
        id: selectedProduct.id,
        name: selectedProduct.name,
        quantity: 1,
        price: selectedProduct.price,
        observation: observation.trim() || undefined
      }]);
      toast.success(`"${selectedProduct.name}" adicionado ao pedido.`);
    }

    setShowObservationModal(false);
    setSelectedProduct(null);
    setObservation("");
  };

  const handleRemoveProduct = (productId: string, observation?: string) => {
    setOrderItems(orderItems.filter(item =>
      !(item.id === productId && item.observation === observation)
    ));
  };

  const handleChangeQuantity = (productId: string, newQuantity: number | string, observation?: string) => {
    // Convert string to number if it's a string
    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;

    // Check if the parsed value is valid
    if (isNaN(quantity) || quantity <= 0) {
      handleRemoveProduct(productId, observation);
      return;
    }

    setOrderItems(orderItems.map(item =>
      (item.id === productId && item.observation === observation)
        ? { ...item, quantity }
        : item
    ));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = subtotal * 0.1;  // 10% service fee
  const total = subtotal + serviceFee;

  const filteredProducts = sampleProducts.filter(
    product =>
      (activeCategory === "todas" || product.category === activeCategory) &&
      (searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.includes(searchQuery))
  );

  const ObservationModal = () => {
    // Referência local para o valor da observação
    const [localObservation, setLocalObservation] = useState(observation);

    // Atualiza o valor local quando o modal é aberto
    React.useEffect(() => {
      if (showObservationModal) {
        setLocalObservation(observation);
      }
    }, [showObservationModal, observation]);

    // Manipulador para fechar a modal
    const handleCloseModal = () => {
      setShowObservationModal(false);
    };

    // Manipulador para adicionar o produto com observação
    const handleAddWithObservation = () => {
      // Atualiza o estado global com o valor local antes de adicionar
      setObservation(localObservation);
      handleAddProductWithObservation();
    };

    // Renderização condicional da modal apenas quando estiver aberta
    if (!showObservationModal) return null;

    return (
      <Dialog open={showObservationModal} onOpenChange={setShowObservationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Observação</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Adicione uma observação para este produto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-lg font-medium">{selectedProduct?.name}</p>
              <p className="text-sm text-gray-500">Preço: R$ {selectedProduct?.price.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="observation" className="text-sm font-medium">
                Observação para o preparo:
              </label>
              {/* Usando textarea nativo em vez do componente Textarea */}
              <textarea
                id="observation"
                placeholder="Ex: Sem cebola com creme, bem passado, etc..."
                value={localObservation}
                onChange={(e) => setLocalObservation(e.target.value)}
                className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleAddWithObservation}>
              Adicionar ao pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const Content = () => (
    <>
      {currentStep === "order" ? (
        <div className="flex flex-col h-full">
          <div className="bg-gray-100 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="text-5xl font-bold text-green-700">{table?.number.toString().padStart(2, '0')}</div>
                <div className="ml-4">
                  <div className="text-lg">Pedido #{table?.id.toString().padStart(5, '0')}</div>
                  <div className="text-sm text-gray-500">
                    Iniciado em {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString().substring(0, 5)}
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setCurrentStep("products")}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> Produtos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="md:col-span-1 space-y-4">
              <div>
                <h3 className="font-bold text-xl mb-2">Nome do Cliente</h3>
                <Input
                  placeholder="Nome do cliente..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <h3 className="font-bold text-xl mb-2">Informações do Pedido</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between mb-2">
                    <span>Código Personalizado:</span>
                    <span className="font-semibold">{Math.floor(10000 + Math.random() * 90000)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" id="blockOrder" />
                    <label htmlFor="blockOrder">Bloquear Pedido (F8)</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white border rounded-md">
                <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold">Itens do Pedido ({orderItems.length})</h3>
                  <div className="flex items-center">
                    <input type="checkbox" id="completeView" className="mr-2" />
                    <label htmlFor="completeView">Exibição Completa</label>
                  </div>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
                  {orderItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum produto adicionado.
                      <Button
                        variant="outline"
                        className="mx-auto mt-2 block"
                        onClick={() => setCurrentStep("products")}
                      >
                        Adicionar produtos
                      </Button>
                    </div>
                  ) : (
                    orderItems.map((item, index) => (
                      <OrderProduct
                        key={`${item.id}-${index}-${item.observation || "no-obs"}`}
                        item={item}
                        onChangeQuantity={(newQuantity) => handleChangeQuantity(item.id, newQuantity, item.observation)}
                        onRemove={() => handleRemoveProduct(item.id, item.observation)}
                      />
                    ))
                  )}
                </div>

                <div className="p-4 space-y-2 bg-gray-50">
                  <div className="flex justify-between font-semibold">
                    <span>SUBTOTAL:</span>
                    <span>{subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(+) SERVIÇO:</span>
                    <span>{serviceFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>TOTAL:</span>
                    <span>{total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t p-4 flex justify-between">
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar (ESC)
            </Button>

            <div className="flex gap-2">
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" /> Imprimir (F9)
              </Button>
              <Button className="bg-gray-800 hover:bg-gray-900">
                <CreditCard className="mr-2 h-4 w-4" /> PAGAMENTO (F5)
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="bg-gray-100 p-4 flex items-center justify-between border-b">
            <Button variant="outline" onClick={() => setCurrentStep("order")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para pedido
            </Button>
            <div className="text-lg font-bold">Localizar Produto</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex h-[calc(100vh-200px)] overflow-hidden">
            <div className="w-64 border-r overflow-y-auto">
              {productCategories.map((category, index) => (
                <div
                  key={category.id}
                  className={`${category.color} ${category.textColor || 'text-white'} border-b border-gray-300 cursor-pointer hover:opacity-90 transition-colors`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <div className={`p-4 flex items-center ${activeCategory === category.id ? 'font-bold' : ''}`}>
                    <div className="mr-2">{index}</div>
                    <div>{category.name}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b bg-white sticky top-0 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-100">
                    <TableRow>
                      <TableHead className="w-24">Categoria</TableHead>
                      <TableHead className="w-20">Código</TableHead>
                      <TableHead>Nome do Produto</TableHead>
                      <TableHead className="w-28">Preço de Venda</TableHead>
                      <TableHead className="w-20 text-center">Adicionar (F11)</TableHead>
                      <TableHead className="w-32 text-center">Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const category = productCategories.find(c => c.id === product.category);
                      return (
                        <TableRow key={product.id} className="hover:bg-gray-50">
                          <TableCell className="py-1">{category?.name.split(' ')[0]}</TableCell>
                          <TableCell className="py-1">{product.code}</TableCell>
                          <TableCell className="py-1">{product.name}</TableCell>
                          <TableCell className="py-1 text-right font-semibold">{product.price.toFixed(2).replace('.', ',')}</TableCell>
                          <TableCell className="py-1 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mx-auto"
                              onClick={() => handleAddProduct(product.id)}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </TableCell>
                          <TableCell className="py-1 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mx-auto h-7 w-7 rounded-full text-gray-500 hover:text-gray-800"
                              onClick={() => handleAddProduct(product.id, true)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t p-4 bg-gray-50">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => setCurrentStep("order")}
            >
              Confirmar seleção ({orderItems.length} itens)
            </Button>
          </div>
        </div>
      )}

      <ObservationModal />
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90%] lg:max-w-[80%] max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Pedido da Mesa {table?.number}</DialogTitle>
        <DialogDescription className="sr-only">
          Gerenciamento de pedidos para a mesa {table ? table.number.toString() : ''}
        </DialogDescription>
        <Content />
      </DialogContent>
    </Dialog>
  );
};

export default TableOrderDrawer;
