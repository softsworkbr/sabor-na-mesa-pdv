import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  ArrowLeft,
  Plus,
  Search,
  CreditCard,
  Printer,
  FileText,
  Loader2,
  List,
  Grid3X3,
  ChevronDown,
} from "lucide-react";
import { useIsMobile, useIsSmallMobile } from "@/hooks/use-mobile";
import OrderProduct from "./OrderProduct";
import {
  Order,
  OrderItem,
  CreateOrderItemProps,
  ProductExtra,
} from "@/utils/restaurant/orderTypes";
import {
  Product,
  ProductCategory
} from "@/utils/restaurant/productTypes";
import {
  addOrderItem,
  createOrder,
  updateOrderItem,
  removeOrderItem,
  addOrderPayment,
} from "@/utils/restaurant/orderManagement";
import {
  updateTable,
  getOrderByTableId,
} from "@/utils/restaurant";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ObservationModal from "./modals/ObservationModal";
import ExtrasModal from "./modals/ExtrasModal";
import PaymentModal, { PaymentItem } from "./modals/PaymentModal";
import PrinterSelectorModal from "./modals/PrinterSelectorModal";
import axios from "axios";

interface Table {
  id: string;
  number: number;
  status: string;
  capacity: number;
  created_at?: string;
  updated_at?: string;
}

interface TableOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  onTableStatusChange?: () => void;
}

const TableOrderDrawer = ({ isOpen, onClose, table, onTableStatusChange }: TableOrderDrawerProps) => {
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStep, setCurrentStep] = useState<"order" | "products">("order");
  const [activeCategory, setActiveCategory] = useState("todas");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [observation, setObservation] = useState("");
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const [realProducts, setRealProducts] = useState<Product[]>([]);
  const [realCategories, setRealCategories] = useState<ProductCategory[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isTableBlocked, setIsTableBlocked] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [availableExtras, setAvailableExtras] = useState<ProductExtra[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrinterSelectorModal, setShowPrinterSelectorModal] = useState(false);
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

  useEffect(() => {
    if (isOpen && table?.id) {
      fetchProductCategories();
    }
  }, [isOpen, table]);

  useEffect(() => {
    if (isOpen && table) {
      setIsTableBlocked(table.status === "blocked");
      loadTableOrder();
    } else {
      resetOrderForm();
    }
  }, [isOpen, table]);

  const fetchProductCategories = async () => {
    setIsLoadingProducts(true);
    try {
      const { data: categories, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .eq('active', true);

      if (categoriesError) throw categoriesError;

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*, product_categories(*)')
        .eq('active', true);

      if (productsError) throw productsError;

      const productsWithCategories = products.map((product) => ({
        ...product,
        category: product.product_categories
      }));

      const allCategory = {
        id: "todas",
        name: "Todas",
        color: "bg-white",
        textColor: "text-black",
        restaurant_id: "",
        active: true
      };

      setRealCategories([allCategory, ...(categories || [])]);
      setRealProducts(productsWithCategories);
    } catch (error: any) {
      console.error("Error fetching products and categories:", error);
      toast.error("Erro ao carregar produtos e categorias");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadTableOrder = async () => {
    if (!table || !table.id) return;

    setLoading(true);
    try {
      const tableId = table.id;

      const order = await getOrderByTableId(tableId);

      if (order) {
        setCurrentOrder(order);
        setOrderId(order.id);
        setCustomerName(order.customer_name || "");

        if (order.items && order.items.length > 0) {
          setOrderItems(order.items);
        } else {
          setOrderItems([]);
        }
      } else {
        setCurrentOrder(null);
        setOrderId(undefined);
        setOrderItems([]);
        setCustomerName("");
      }
    } catch (error) {
      console.error("Error loading table order:", error);
      toast.error("Erro ao carregar pedido da mesa");
    } finally {
      setLoading(false);
    }
  };

  const resetOrderForm = () => {
    setCurrentOrder(null);
    setOrderId(undefined);
    setOrderItems([]);
    setCustomerName("");
    setCurrentStep("order");
    setActiveCategory("todas");
    setSelectedProduct(null);
    setObservation("");
    setIsTableBlocked(false);
    setSelectedExtras([]);
  };

  const saveOrder = async () => {
    if (!table || !table.id) return null;

    setLoading(true);
    try {
      let order: Order;

      if (!currentOrder || !orderId) {
        const tableId = table.id;

        order = await createOrder({
          table_id: tableId,
          customer_name: customerName || undefined,
        });

        setCurrentOrder(order);
        setOrderId(order.id);

        if (table.status !== "active") {
          await updateTable(tableId, { status: "active" });
        }
      }

      toast.success(currentOrder ? "Pedido atualizado" : "Pedido criado com sucesso");
      return orderId || order?.id;
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Erro ao salvar pedido");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductWithObservation = async (productObservation?: string) => {
    if (!selectedProduct) return;

    const extrasToSave = [...selectedExtras];

    console.log("Adding product with observation:", productObservation || observation);
    console.log("Adding product with extras:", extrasToSave);

    try {
      await addProductToOrder(selectedProduct, productObservation || observation, extrasToSave);
      setShowObservationModal(false);
      setShowExtrasModal(false);
      setSelectedProduct(null);
      setObservation("");
      setSelectedExtras([]);
    } catch (error) {
      console.error("Error adding product with extras:", error);
      toast.error("Erro ao adicionar produto com adicionais");
    }
  };

  const addProductToOrder = async (product: Product, productObservation?: string, extras: ProductExtra[] = []) => {
    if (isTableBlocked) {
      toast.error("Esta mesa está bloqueada para fechamento. Não é possível adicionar itens.");
      return;
    }

    try {
      console.log("Adding product to order:", product.name);
      console.log("With observation:", productObservation);
      console.log("With extras:", extras);

      let currentOrderId = orderId;
      if (!currentOrderId) {
        currentOrderId = await saveOrder();
        if (!currentOrderId) {
          toast.error("Não foi possível criar o pedido");
          return;
        }
      }

      let totalPrice = product.price;
      extras.forEach(extra => {
        totalPrice += extra.price;
      });

      const generateExtrasKey = (extrasArray: ProductExtra[]) => {
        return extrasArray
          .map(e => e.id)
          .sort()
          .join(',');
      };

      const currentExtrasKey = generateExtrasKey(extras);

      const existingItemIndex = orderItems.findIndex(item => {
        const basicMatch = item.product_id === product.id && item.observation === productObservation;

        let extrasMatch = true;
        if (extras.length > 0 || (item.extras && item.extras.length > 0)) {
          const itemExtrasKey = item.extras
            ? generateExtrasKey(item.extras)
            : '';

          extrasMatch = itemExtrasKey === currentExtrasKey;
        }

        return basicMatch && extrasMatch;
      });

      if (existingItemIndex >= 0) {
        const existingItem = orderItems[existingItemIndex];
        if (!existingItem.id) return;

        const updatedItem = await updateOrderItem(existingItem.id, {
          quantity: (existingItem.quantity || 1) + 1
        });

        const updatedItems = [...orderItems];
        updatedItems[existingItemIndex] = updatedItem;
        setOrderItems(updatedItems);
      } else {
        const newItem = await addOrderItem({
          order_id: currentOrderId,
          product_id: product.id,
          name: product.name,
          price: totalPrice,
          quantity: 1,
          observation: productObservation || null,
          extras: extras.length > 0 ? extras : null
        });

        console.log("New item added with extras:", newItem);
        setOrderItems([...orderItems, newItem]);
      }

      // await calculateOrderTotal(currentOrderId);
      toast.success(`"${product.name}" adicionado ao pedido.`);
    } catch (error) {
      console.error("Error adding product to order:", error);
      toast.error("Erro ao adicionar produto");
    }
  };

  const handleAddProduct = async (productId: string, withOptions = false) => {
    if (!productId || !table || !table.id) return;

    const productsToSearch = filteredProducts?.length > 0 ? filteredProducts : [];
    const product = productsToSearch.find(p => p.id === productId);
    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }

    setSelectedProduct(null);
    setObservation("");
    setSelectedExtras([]);

    setSelectedProduct(product);

    const productHasExtras = product.category?.has_extras || false;

    if (withOptions) {
      if (productHasExtras) {
        const extras = await fetchProductExtras(productId);
        setAvailableExtras(extras);

        setShowExtrasModal(true);
      } else {
        setShowObservationModal(true);
      }
    } else {
      await addProductToOrder(product);
    }
  };

  const handleRemoveProduct = async (itemId: string) => {
    if (!itemId) return;

    try {
      await removeOrderItem(itemId);

      setOrderItems(orderItems.filter(item => item.id !== itemId));

      const newTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const serviceFee = newTotal * 0.1;
      const total = newTotal + serviceFee;

      toast.success("Produto removido com sucesso");
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error("Erro ao remover produto");
    }
  };

  const handleChangeQuantity = async (itemId: string, newQuantity: number | string) => {
    if (!itemId) return;

    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;

    if (isNaN(quantity) || quantity <= 0) {
      await handleRemoveProduct(itemId);
      return;
    }

    try {
      const updatedItem = await updateOrderItem(itemId, { quantity });

      setOrderItems(orderItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Erro ao atualizar quantidade");
    }
  };

  const handleToggleBlockTable = async () => {
    if (!table || !table.id) return;

    try {
      const newStatus = isTableBlocked ? "active" : "blocked";
      await updateTable(table.id, { status: newStatus });
      setIsTableBlocked(!isTableBlocked);

      toast.success(isTableBlocked
        ? "Mesa desbloqueada com sucesso"
        : "Mesa bloqueada para fechamento");
    } catch (error) {
      console.error("Error toggling table block status:", error);
      toast.error("Erro ao alterar o status da mesa");
    }
  };

  const handleToggleExtra = React.useCallback((extra: ProductExtra) => {
    setSelectedExtras(prevExtras => {
      const isSelected = prevExtras.some(e => e.id === extra.id);

      if (isSelected) {
        return prevExtras.filter(e => e.id !== extra.id);
      } else {
        return [...prevExtras, extra];
      }
    });
  }, []);

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  const categoriesToUse = realCategories.length > 0 ? realCategories : [];
  const productsToUse = realProducts.length > 0 ? realProducts : [];

  const filteredProducts = productsToUse.filter(
    product =>
      (activeCategory === "todas" || product.category_id === activeCategory) &&
      (searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.includes(searchQuery))
  );

  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const categoryId = product.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const Content = () => (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : currentStep === "order" ? (
        <div className="flex flex-col h-full">
          <div className={`${isTableBlocked ? "bg-red-100" : "bg-gray-100"} p-2 md:p-4`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`text-3xl md:text-5xl font-bold ${isTableBlocked ? "text-red-700" : "text-green-700"}`}>
                  {table?.number.toString().padStart(2, '0')}
                </div>
                <div className="ml-2 md:ml-4">
                  <div className="text-sm md:text-lg">
                    {orderId ? `Pedido #${orderId.substring(0, 6)}` : "Novo Pedido"}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    {currentOrder?.created_at
                      ? `Iniciado em ${new Date(currentOrder.created_at).toLocaleDateString()} às ${new Date(currentOrder.created_at).toLocaleTimeString().substring(0, 5)}`
                      : `${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString().substring(0, 5)}`
                    }
                  </div>
                  {isTableBlocked && (
                    <div className="text-xs md:text-sm font-semibold text-red-600 mt-1">
                      {isSmallMobile ? "MESA BLOQUEADA" : "MESA BLOQUEADA PARA FECHAMENTO"}
                    </div>
                  )}
                </div>
              </div>
              <Button
                size={isMobile ? "sm" : "lg"}
                className={`${isTableBlocked ? "bg-gray-500 hover:bg-gray-600" : "bg-green-600 hover:bg-green-700"} text-xs md:text-base`}
                onClick={() => setCurrentStep("products")}
                disabled={isTableBlocked}
              >
                <ShoppingCart className="mr-1 md:mr-2 h-4 w-4" />
                {!isSmallMobile && "Produtos"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 p-2 md:p-4">
            <div className="md:col-span-1 space-y-3 md:space-y-4">
              <div>
                <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2">Nome do Cliente</h3>
                <Input
                  placeholder="Nome do cliente..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full"
                  disabled={isTableBlocked}
                />
              </div>

              <div>
                <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2">Informações</h3>
                <div className="bg-gray-50 p-3 md:p-4 rounded border">
                  <div className="flex justify-between mb-2">
                    <span>Código:</span>
                    <span className="font-semibold">
                      {orderId ? orderId.substring(0, 5) : Math.floor(10000 + Math.random() * 90000)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 md:mt-4">
                    <input
                      type="checkbox"
                      id="blockOrder"
                      checked={isTableBlocked}
                      onChange={handleToggleBlockTable}
                    />
                    <label
                      htmlFor="blockOrder"
                      className={`${isTableBlocked ? "text-red-600 font-semibold" : ""} text-sm md:text-base`}
                    >
                      {isSmallMobile ? "Bloquear Mesa" : "Bloquear Pedido para Fechamento (F8)"}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white border rounded-md h-full flex flex-col">
                <div className="p-2 md:p-3 border-b bg-gray-50 flex justify-between items-center sticky top-0">
                  <h3 className="font-semibold text-sm md:text-base">Itens do Pedido ({orderItems.length})</h3>
                  <div className="flex items-center">
                    {!isSmallMobile && (
                      <>
                        <input type="checkbox" id="completeView" className="mr-2" />
                        <label htmlFor="completeView" className="text-sm">Exibição Completa</label>
                      </>
                    )}
                  </div>
                </div>

                <div className="overflow-y-auto flex-grow" style={{ maxHeight: isMobile ? "300px" : "400px" }}>
                  {orderItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-sm md:text-base">Nenhum produto adicionado.</div>
                      <Button
                        variant="outline"
                        className="mx-auto mt-2 block text-xs md:text-sm"
                        onClick={() => setCurrentStep("products")}
                        disabled={isTableBlocked}
                      >
                        Adicionar produtos
                      </Button>
                    </div>
                  ) : (
                    <div className={isMobile ? "divide-y" : ""}>
                      {orderItems.map((item, index) => (
                        <OrderProduct
                          key={`${item.id || item.product_id}-${index}-${item.observation || "no-obs"}`}
                          item={item}
                          onChangeQuantity={(newQuantity) => !isTableBlocked && item.id && handleChangeQuantity(item.id, newQuantity)}
                          onRemove={() => !isTableBlocked && item.id && handleRemoveProduct(item.id)}
                          disabled={isTableBlocked}
                          isMobile={isMobile}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 md:p-4 space-y-1 md:space-y-2 bg-gray-50 border-t">
                  <div className="flex justify-between font-semibold">
                    <span className="text-sm md:text-base">SUBTOTAL:</span>
                    <span className="text-sm md:text-base">{subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span>(+) SERVIÇO:</span>
                    <span>{serviceFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base md:text-lg border-t pt-1 md:pt-2 mt-1">
                    <span>TOTAL:</span>
                    <span>{total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t p-2 md:p-4 flex flex-col md:flex-row justify-between items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full md:w-auto text-sm"
              size={isMobile ? "sm" : "default"}
            >
              <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
              {isSmallMobile ? "Voltar" : "Voltar (ESC)"}
            </Button>

            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                className="text-sm flex-1 md:flex-initial"
                size={isMobile ? "sm" : "default"}
                onClick={handleOpenPrinterSelector}
              >
                <Printer className="mr-1 md:mr-2 h-4 w-4" />
                {isSmallMobile ? "Imprimir" : "Imprimir (F9)"}
              </Button>
              <Button
                className={`${isTableBlocked ? "bg-red-800 hover:bg-red-900" : "bg-gray-800 hover:bg-gray-900"} text-sm flex-1 md:flex-initial`}
                size={isMobile ? "sm" : "default"}
                onClick={handlePayment}
              >
                <CreditCard className="mr-1 md:mr-2 h-4 w-4" />
                {isSmallMobile ? "Pagamento" : "PAGAMENTO (F5)"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="bg-gray-100 p-3 md:p-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between border-b">
            <div className="flex items-center">
              <Button variant="outline" onClick={() => setCurrentStep("order")} className="mr-2" size={isMobile ? "sm" : "default"}>
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className={isSmallMobile ? "hidden" : ""}>Voltar</span>
              </Button>
              <h2 className="text-base md:text-lg font-bold">Produtos</h2>
            </div>
            <div className="flex items-center gap-2 w-full md:w-1/3 mt-2 md:mt-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar produto..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    {viewMode === "grid" ? (
                      <Grid3X3 className="h-4 w-4" />
                    ) : (
                      <List className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewMode("grid")}>
                    <Grid3X3 className="h-4 w-4 mr-2" /> Grid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode("list")}>
                    <List className="h-4 w-4 mr-2" /> Lista
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex h-[calc(100vh-200px)] overflow-hidden">
            {isMobile ? (
              <div className="w-full p-3 bg-gray-50 border-b">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="truncate">
                        {categoriesToUse.find(c => c.id === activeCategory)?.name || "Todas"}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[280px] max-h-[50vh] overflow-y-auto">
                    {categoriesToUse.map((category) => (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={activeCategory === category.id ? "bg-accent" : ""}
                      >
                        <div
                          className={`w-3 h-3 mr-2 rounded-full ${category.color || "bg-gray-200"}`}
                        />
                        <span>{category.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="overflow-y-auto flex-1">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-100">
                      <TableRow>
                        <TableHead className="w-24">Categoria</TableHead>
                        <TableHead className="w-20">Código</TableHead>
                        <TableHead>Nome do Produto</TableHead>
                        <TableHead className="w-28">Preço de Venda</TableHead>
                        <TableHead className="w-20 text-center">Adicionar</TableHead>
                        <TableHead className="w-32 text-center">Opções</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const category = categoriesToUse.find(c => c.id === product.category_id);
                        return (
                          <TableRow key={product.id} className="hover:bg-gray-50">
                            <TableCell className="py-1">{category?.name.split(' ')[0]}</TableCell>
                            <TableCell className="py-1">{product.id}</TableCell>
                            <TableCell className="py-1">
                              {product.name}
                              {category?.has_extras && (
                                <span className="ml-1 text-xs bg-blue-50 text-blue-800 px-1 rounded">+Adicionais</span>
                              )}
                            </TableCell>
                            <TableCell className="py-1 text-right font-semibold">{product.price.toFixed(2).replace('.', ',')}</TableCell>
                            <TableCell className="py-1 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="mx-auto"
                                onClick={() => handleAddProduct(product.id, true)}
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
            ) : (
              <>
                <div className="w-64 border-r overflow-y-auto">
                  {categoriesToUse.map((category) => (
                    <div
                      key={category.id}
                      className={`${category.color || 'bg-gray-200'} ${category.textColor || 'text-gray-800'} border-b border-gray-300 cursor-pointer hover:opacity-90 transition-colors`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <div className={`p-4 flex items-center ${activeCategory === category.id ? 'font-bold' : ''}`}>
                        <div className="mr-2">
                          {category.id === "todas" ? "•" : category.has_extras ? "+" : ""}
                        </div>
                        <div>{category.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  {isLoadingProducts ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {activeCategory !== "todas" ? (
                        <CategoryProductGroup
                          category={categoriesToUse.find(c => c.id === activeCategory)}
                          products={filteredProducts}
                          onAddProduct={handleAddProduct}
                          viewMode={viewMode}
                          isMobile={isMobile}
                        />
                      ) : (
                        Object.entries(productsByCategory).map(([categoryId, products]) => {
                          const category = categoriesToUse.find(c => c.id === categoryId);
                          return (
                            <CategoryProductGroup
                              key={categoryId}
                              category={category}
                              products={products}
                              onAddProduct={handleAddProduct}
                              viewMode={viewMode}
                              isMobile={isMobile}
                            />
                          );
                        })
                      )}

                      {filteredProducts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          Nenhum produto encontrado para esta categoria.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
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

      <ObservationModal
        showModal={showObservationModal}
        onClose={() => setShowObservationModal(false)}
        onAdd={(localObservation) => {
          setObservation(localObservation);

          if (selectedProduct) {
            addProductToOrder(selectedProduct, localObservation, selectedExtras)
              .then(() => {
                setShowObservationModal(false);
                setSelectedProduct(null);
                setObservation("");
                setSelectedExtras([]);
              })
              .catch(error => {
                console.error("Error adding product with observation:", error);
                toast.error("Erro ao adicionar produto com observação");
              });
          }
        }}
        selectedProduct={selectedProduct}
        selectedExtras={selectedExtras}
        initialObservation={observation}
      />

      <ExtrasModal
        showModal={showExtrasModal}
        onClose={() => {
          setShowExtrasModal(false);
          setSelectedExtras([]);
        }}
        onAddWithExtras={(extrasToSave) => {
          setSelectedExtras(extrasToSave);

          if (selectedProduct) {
            addProductToOrder(selectedProduct, "", extrasToSave)
              .then(() => {
                setShowExtrasModal(false);
                setSelectedProduct(null);
                setSelectedExtras([]);
              })
              .catch(error => {
                console.error("Error adding product with extras:", error);
                toast.error("Erro ao adicionar produto com adicionais");
              });
          }
        }}
        onContinueToObservation={(extrasToSave) => {
          setSelectedExtras(extrasToSave);
          setShowExtrasModal(false);
          setShowObservationModal(true);
        }}
        selectedProduct={selectedProduct}
        availableExtras={availableExtras}
        initialSelectedExtras={selectedExtras}
      />

      <PaymentModal
        showModal={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onComplete={handleCompletePayment}
        totalAmount={total}
        serviceFee={serviceFee}
      />
      <PrinterSelectorModal
        showModal={showPrinterSelectorModal}
        onClose={() => setShowPrinterSelectorModal(false)}
        onPrinterSelect={handlePrinterSelect}
        onPrint={handlePrint}
        selectedPrinter={selectedPrinters[0]}
      />
    </>
  );

  const handlePayment = () => {
    if (!orderId) {
      toast.error("É necessário criar um pedido antes de realizar o pagamento");
      return;
    }

    setShowPaymentModal(true);
  };

  const handleCompletePayment = async (payments: PaymentItem[], includeServiceFee: boolean) => {
    try {
      if (!orderId || !table) return;

      console.log("Processando pagamentos:", payments);
      console.log("Incluir taxa de serviço:", includeServiceFee);

      // Usar as funções da API para salvar os pagamentos
      for (const payment of payments) {
        try {
          console.log("Salvando pagamento:", payment);
          await addOrderPayment({
            order_id: orderId,
            payment_method_id: payment.method.id,
            amount: payment.amount,
            include_service_fee: includeServiceFee
          });
        } catch (paymentError) {
          console.error("Erro ao salvar pagamento individual:", paymentError);
          throw paymentError;
        }
      }

      try {
        console.log("Atualizando status do pedido:", orderId);
        // Atualizar o status do pedido para completado, mas manter a referência à mesa
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'completed',  // Atualizar status do pedido para completado
            payment_status: 'paid',
            service_fee: includeServiceFee ? serviceFee : 0  // Atualizar a taxa de serviço
          })
          .eq('id', orderId);

        if (orderUpdateError) {
          console.error("Erro ao atualizar status do pedido:", orderUpdateError);
          throw orderUpdateError;
        }
      } catch (orderError) {
        console.error("Erro ao atualizar pedido:", orderError);
        throw orderError;
      }

      try {
        console.log("Liberando mesa:", table.id);
        // Liberar a mesa (atualizar status para "free")
        await updateTable(table.id, {
          status: "free"
        });
      } catch (tableError) {
        console.error("Erro ao liberar mesa:", tableError);
        throw tableError;
      }

      setShowPaymentModal(false);

      toast.success("Pagamento realizado com sucesso! Mesa liberada.");

      onClose();

      // Recarregar as mesas para atualizar a interface
      if (typeof onTableStatusChange === 'function') {
        onTableStatusChange();
      }

    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      toast.error(`Erro ao processar pagamento: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handlePrinterSelect = (printerName: string) => {
    // We still keep this function for backward compatibility
    // but we don't need to update the state here anymore
    // as the modal component now manages the selected printers
  };

  const handleOpenPrinterSelector = () => {
    setShowPrinterSelectorModal(true);
  };

  const handlePrint = async (printerNames: string[]) => {
    if (printerNames.length > 0 && currentOrder) {
      try {
        // Show loading toast
        const loadingToast = toast.loading(`Enviando impressão para ${printerNames.length} impressora${printerNames.length > 1 ? 's' : ''}...`);

        // Generate the print text for the order
        const printText = generatePrintText(currentOrder, orderItems, table);

        // Create an array of promises for each printer
        const printPromises = printerNames.map(printerName =>
          sendPrintRequest(printerName, printText)
        );

        // Wait for all print requests to complete
        const results = await Promise.all(printPromises);

        // Count successful prints
        const successCount = results.filter(result => result.success).length;

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        // Show success or partial success message
        if (successCount === printerNames.length) {
          toast.success(`Pedido impresso com sucesso em ${successCount} impressora${successCount > 1 ? 's' : ''}`);
        } else if (successCount > 0) {
          toast.warning(`Pedido impresso em ${successCount} de ${printerNames.length} impressoras`);
        } else {
          toast.error("Falha ao imprimir em todas as impressoras");
        }

        // Save the selected printers for future use
        setSelectedPrinters(printerNames);
      } catch (error) {
        console.error("Error printing:", error);
        toast.error("Erro ao enviar impressão");
      }
    } else if (printerNames.length === 0) {
      toast.error("Selecione pelo menos uma impressora para imprimir");
    } else if (!currentOrder) {
      toast.error("Não há pedido para imprimir");
    }
  };

  // Function to generate the print text for the order
  const generatePrintText = (order: Order, items: OrderItem[], table: Table | null) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Define receipt width and price column width
    const RECEIPT_WIDTH = 32; // Total width of the receipt in characters
    const PRICE_WIDTH = 10;   // Width reserved for the price column

    // Helper function to format text with proper alignment
    const formatLine = (leftText: string, rightText: string) => {
      // If the left text is too long, wrap it
      if (leftText.length > RECEIPT_WIDTH - PRICE_WIDTH) {
        // Split the left text into multiple lines
        const lines: string[] = [];
        let currentLine = leftText;

        while (currentLine.length > RECEIPT_WIDTH - PRICE_WIDTH) {
          // Find the last space before the cutoff point
          const cutPoint = currentLine.substring(0, RECEIPT_WIDTH - PRICE_WIDTH).lastIndexOf(' ');

          // If no space found, force cut at the max length
          const splitPoint = cutPoint > 0 ? cutPoint : RECEIPT_WIDTH - PRICE_WIDTH;

          lines.push(currentLine.substring(0, splitPoint));
          currentLine = currentLine.substring(splitPoint + 1);
        }

        // Add the remaining text
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        // Format the first line with the price
        const result = [
          `${lines[0]}${' '.repeat(RECEIPT_WIDTH - lines[0].length - rightText.length)}${rightText}`
        ];

        // Add the remaining lines with proper indentation
        for (let i = 1; i < lines.length; i++) {
          result.push(`   ${lines[i]}`); // Add indentation for wrapped lines
        }

        return result.join('\n');
      } else {
        // Simple case: left text fits on one line
        return `${leftText}${' '.repeat(RECEIPT_WIDTH - leftText.length - rightText.length)}${rightText}`;
      }
    };

    let text = "";

    // Header
    text += "================================\n";
    text += "        PEDIDO PARA COZINHA       \n";
    text += `           Pedido #${order.id?.substring(0, 8) || ''}            \n`;
    text += "================================\n";
    text += `Data: ${dateStr} ${timeStr}    Mesa: ${table?.number || '-'}\n\n`;

    // Customer name if available
    if (customerName) {
      text += `Cliente: ${customerName}\n\n`;
    }

    // Items
    text += "ITENS DO PEDIDO:\n";
    text += "--------------------------------\n";

    items.forEach(item => {
      // Item name and price
      const itemText = `${item.quantity}x ${item.name}`;
      const priceText = `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`;

      text += formatLine(itemText, priceText) + '\n';

      // Observation if available
      if (item.observation) {
        text += `   OBS: ${item.observation}\n`;
      }

      // Extras if available
      if (item.extras && item.extras.length > 0) {
        item.extras.forEach(extra => {
          const extraText = `   +${extra.name}`;
          const extraPriceText = `R$ ${(extra.price * item.quantity).toFixed(2).replace('.', ',')}`;

          text += formatLine(extraText, extraPriceText) + '\n';
        });
      }

      // Add a blank line between items
      text += "\n";
    });

    // Footer
    text += "--------------------------------\n";

    // Order observation if available
    if (order.customer_name) {
      text += `Obs: Cliente ${order.customer_name}\n`;
    }
    
    // Calculate and add the total
    const subtotal = items.reduce((sum, item) => {
      // Add the base item price
      let itemTotal = item.price * item.quantity;
      
      // Add extras if any
      if (item.extras && item.extras.length > 0) {
        itemTotal += item.extras.reduce((extraSum, extra) => 
          extraSum + (extra.price * item.quantity), 0);
      }
      
      return sum + itemTotal;
    }, 0);
    
    // Add a blank line before totals
    text += "\n";
    
    // Format the subtotal
    const subtotalText = "SUBTOTAL:";
    const subtotalPriceText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    text += formatLine(subtotalText, subtotalPriceText) + '\n';
    
    // Add service fee if applicable
    if (order.service_fee && order.service_fee > 0) {
      const serviceFeeText = "TAXA DE SERVIÇO (10%):";
      const serviceFeePriceText = `R$ ${order.service_fee.toFixed(2).replace('.', ',')}`;
      text += formatLine(serviceFeeText, serviceFeePriceText) + '\n';
      
      // Add total with service fee
      const totalText = "TOTAL:";
      const totalPriceText = `R$ ${(subtotal + order.service_fee).toFixed(2).replace('.', ',')}`;
      text += formatLine(totalText, totalPriceText) + '\n';
    }
    
    text += "================================\n";

    return text;
  };

  // Function to send the print request to the server
  const sendPrintRequest = async (printerName: string, text: string) => {
    try {
      // Find the printer configuration for this printer
      const { data: printerConfig, error: printerError } = await supabase
        .from('printer_configs')
        .select('*')
        .eq('windows_printer_name', printerName)
        .single();

      if (printerError) {
        console.error(`Error fetching printer config for ${printerName}:`, printerError);
        return { success: false, printerName, error: printerError };
      }

      if (!printerConfig.ip_address) {
        console.error(`No IP address configured for printer ${printerName}`);
        return { success: false, printerName, error: 'No IP address configured' };
      }

      // Construct the URL using the printer's IP address and endpoint (or default to /print if not specified)
      const endpoint = printerConfig.endpoint || '/print';
      const url = `http://${printerConfig.ip_address}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

      console.log(`Sending print request to ${url} for printer ${printerName}`);

      const response = await axios.post(url, {
        printerName,
        text,
        options: {
          align: "left",
          font: "A",
          doubleSize: false,
          bold: true,
          beep: true
        }
      });

      return { success: true, printerName, response: response.data };
    } catch (error) {
      console.error(`Error printing to ${printerName}:`, error);
      return { success: false, printerName, error };
    }
  };

  const CategoryProductGroup = ({
    category,
    products,
    onAddProduct,
    viewMode,
    isMobile
  }: {
    category?: ProductCategory;
    products: Product[];
    onAddProduct: (id: string, withOptions?: boolean) => void;
    viewMode: "grid" | "list";
    isMobile: boolean;
  }) => {
    if (!category) return null;

    return (
      <div className="mb-6">
        <div className={`${category.color || 'bg-gray-200'} ${category.textColor || 'text-gray-800'} px-4 py-2 rounded-lg mb-3`}>
          <h3 className="font-bold">
            {category.name}
            {category.has_extras && (
              <span className="ml-2 text-xs bg-white text-blue-800 px-2 py-0.5 rounded">Permite adicionais</span>
            )}
          </h3>
        </div>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg bg-white shadow-sm p-2">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">
                      {product.name}
                      {category.has_extras && (
                        <span className="ml-1 text-xs bg-blue-50 text-blue-800 px-1 rounded">+</span>
                      )}
                    </h4>
                    <p className="text-base font-bold mt-1">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <Button
                      size={isMobile ? "sm" : "default"}
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-600"
                      onClick={() => onAddProduct(product.id, true)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      size={isMobile ? "sm" : "default"}
                      variant="default"
                      className="h-8 rounded-full px-3 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => onAddProduct(product.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg bg-white shadow-sm p-2 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {product.name}
                    {category.has_extras && (
                      <span className="ml-1 text-xs bg-blue-50 text-blue-800 px-1 rounded">+</span>
                    )}
                  </h4>
                  <p className="text-sm font-bold">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-blue-600"
                    onClick={() => onAddProduct(product.id, true)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white rounded-full"
                    onClick={() => onAddProduct(product.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const fetchProductExtras = async (productId: string) => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, product_categories(*)')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (!product.product_categories.has_extras) {
        return [];
      }

      const { data: extras, error: extrasError } = await supabase
        .from('product_extras')
        .select('*')
        .eq('active', true)
        .order('name');

      if (extrasError) throw extrasError;

      return extras || [];
    } catch (error: any) {
      console.error("Error fetching product extras:", error);
      toast.error("Erro ao carregar adicionais do produto");
      return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90%] lg:max-w-[80%] max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Pedido da Mesa {table?.number}</DialogTitle>
        <DialogDescription className="sr-only">
          Gerenciamento de pedidos para a mesa {table ? table.number.toString() : ''}
        </DialogDescription>
        {Content()}
      </DialogContent>
    </Dialog>
  );
};

export default TableOrderDrawer;
