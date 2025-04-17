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
  updateTableCustomerName,
  getOrderByTableId,
} from "@/utils/restaurant";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { getCurrentCashRegister, createCashRegisterTransaction } from "@/utils/restaurant/cashRegisterManagement";
import { useAuth } from "@/contexts/AuthContext";
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
  const { currentRestaurant } = useAuth();
  const [isCashRegisterLoading, setIsCashRegisterLoading] = useState(false);

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

  const handleCustomerNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomerName = e.target.value;
    setCustomerName(newCustomerName);

    if (table?.id) {
      try {
        await updateTableCustomerName(table.id, newCustomerName || null);
      } catch (error) {
        console.error("Error saving customer name:", error);
      }
    }
  };

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
                  onChange={handleCustomerNameChange}
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
                          onReprint={() => !isTableBlocked && item.id && handleReprintItem(item.id)}
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
                disabled={isCashRegisterLoading}
              >
                {isCashRegisterLoading ? (
                  <>
                    <Loader2 className="mr-1 md:mr-2 h-4 w-4 animate-spin" />
                    {isSmallMobile ? "Verificando..." : "Verificando caixa..."}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-1 md:mr-2 h-4 w-4" />
                    {isSmallMobile ? "Pagamento" : "PAGAMENTO (F5)"}
                  </>
                )}
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
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-2 border-b bg-gray-50">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>
                          {categoriesToUse.find(c => c.id === activeCategory)?.name || "Todas as categorias"}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-[60vh] overflow-y-auto">
                      {categoriesToUse.map((category) => (
                        <DropdownMenuItem
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`${activeCategory === category.id ? 'font-bold bg-gray-100' : ''}`}
                        >
                          <span className="mr-2">
                            {category.id === "todas" ? "•" : category.has_extras ? "+" : ""}
                          </span>
                          {category.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                  {isLoadingProducts ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-3">
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
                    </div>
                  )}
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

      {showPaymentModal && currentOrder && (
        <PaymentModal
          showModal={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handleCompletePayment}
          totalAmount={currentOrder.total_amount || orderItems.reduce((sum, item) => {
            let itemTotal = item.price * item.quantity;
            // Add extras if any
            if (item.extras && item.extras.length > 0) {
              itemTotal += item.extras.reduce((extraSum, extra) =>
                extraSum + (extra.price * item.quantity), 0);
            }
            return sum + itemTotal;
          }, 0)}
          serviceFee={serviceFee}
        />
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

      <PrinterSelectorModal
        showModal={showPrinterSelectorModal}
        onClose={() => setShowPrinterSelectorModal(false)}
        onPrinterSelect={handlePrinterSelect}
        onPrint={handlePrint}
        selectedPrinter={selectedPrinters[0]}
      />
    </>
  );

  const handlePayment = async () => {
    console.log("handlePayment called, orderId:", orderId);

    if (!orderId) {
      toast.error("É necessário criar um pedido antes de realizar o pagamento");
      return;
    }

    setIsCashRegisterLoading(true);
    try {
      console.log("Verificando caixa para o restaurante:", currentRestaurant?.id);
      // Verificar se existe um caixa aberto
      const cashRegister = await getCurrentCashRegister(currentRestaurant?.id || '');
      console.log("Resultado da verificação do caixa:", cashRegister);

      if (!cashRegister) {
        toast.error("Não há caixa aberto. É necessário abrir o caixa antes de realizar pagamentos.");
        return;
      }

      // Se o caixa estiver aberto, prosseguir com o pagamento
      console.log("Abrindo modal de pagamento");
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error("Erro ao verificar caixa:", error);
      toast.error(`Erro ao verificar status do caixa: ${error.message || 'Erro desconhecido'}. Tente novamente.`);
    } finally {
      setIsCashRegisterLoading(false);
    }
  };

  const handleCompletePayment = async (payments: PaymentItem[], includeServiceFee: boolean) => {
    try {
      if (!orderId || !table) return;

      console.log("Processando pagamentos:", payments);
      console.log("Incluir taxa de serviço:", includeServiceFee);

      // Get the current cash register
      if (!currentRestaurant?.id) {
        toast.error("Restaurante não identificado");
        return;
      }

      const currentCashRegister = await getCurrentCashRegister(currentRestaurant.id);
      if (!currentCashRegister) {
        toast.error("Não há caixa aberto. Abra o caixa antes de finalizar pagamentos.");
        return;
      }

      // Usar as funções da API para salvar os pagamentos
      for (const payment of payments) {
        try {
          console.log("Salvando pagamento:", payment);

          // Save the payment using the existing function
          const paymentData = await addOrderPayment({
            order_id: orderId,
            payment_method_id: payment.method.id,
            amount: payment.amount,
            include_service_fee: includeServiceFee
          });

          // Register the transaction in the cash register
          await createCashRegisterTransaction({
            cash_register_id: currentCashRegister.id,
            order_id: orderId,
            order_payment_id: paymentData.id,
            amount: payment.amount,
            balance: 0, // This value will be calculated by the database trigger
            type: 'payment',
            payment_method_id: payment.method.id,
            notes: `Pagamento de pedido #${orderId.substring(0, 6)} - Mesa ${table.number}`
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
        setLoading(true);
        // Show loading toast
        const loadingToast = toast.loading(`Enviando impressão para ${printerNames.length} impressora${printerNames.length > 1 ? 's' : ''}...`);

        // Set a timeout to dismiss the loading toast after 20 seconds
        const timeoutId = setTimeout(() => {
          toast.dismiss(loadingToast);
          toast.warning("A operação de impressão está demorando mais que o esperado. Verifique a impressora.");
        }, 20000); // 20 seconds

        // Check if we have a pending item to print from the printer selector
        const pendingItemId = localStorage.getItem('pendingPrintItemId');
        if (pendingItemId) {
          // Clear the pending item
          localStorage.removeItem('pendingPrintItemId');

          // Find the item
          const itemToPrint = orderItems.find(item => item.id === pendingItemId);
          if (itemToPrint) {
            // Mark as printed in database
            if (itemToPrint.id) {
              const { data, error } = await supabase
                .from('order_items')
                .update({ printed_at: new Date().toISOString() })
                .eq('id', itemToPrint.id)
                .select();

              if (error) throw error;
            }

            // Update local state
            const updatedItems = orderItems.map(item =>
              item.id === pendingItemId ? { ...item, printed_at: new Date().toISOString() } : item
            );
            setOrderItems(updatedItems);

            // Generate and print text for this single item
            const singleItemText = generateSingleItemPrintText(currentOrder, itemToPrint, table);

            // Send to selected printers
            for (const printerName of printerNames) {
              await sendPrintRequest(printerName, singleItemText);
            }

            // Clear the timeout since the operation completed
            clearTimeout(timeoutId);

            toast.dismiss(loadingToast);
            toast.success("Item enviado para impressão");
            setSelectedPrinters(printerNames);
            setLoading(false);
            return;
          }
        }

        // Get only the items that haven't been printed yet
        const itemsToPrint = orderItems.filter(item => !item.printed_at);

        if (itemsToPrint.length === 0) {
          // Clear the timeout since the operation completed
          clearTimeout(timeoutId);

          toast.dismiss(loadingToast);
          toast.warning("Não há itens para imprimir. Todos os itens já foram impressos.");
          setLoading(false);
          return;
        }

        // Generate text only for items that haven't been printed
        const text = generatePrintText(currentOrder, itemsToPrint, table);

        // Mark items as printed
        const updatePromises = itemsToPrint.map(async (item) => {
          if (item.id) {
            const { data, error } = await supabase
              .from('order_items')
              .update({ printed_at: new Date().toISOString() })
              .eq('id', item.id)
              .select();

            if (error) throw error;
          }
          return { ...item, printed_at: new Date().toISOString() };
        });

        // Update local state with printed items
        const updatedItems = await Promise.all(updatePromises);

        // Replace the printed items in the orderItems array
        const newOrderItems = [...orderItems];
        updatedItems.forEach(updatedItem => {
          const index = newOrderItems.findIndex(item => item.id === updatedItem.id);
          if (index !== -1) {
            newOrderItems[index] = updatedItem;
          }
        });

        setOrderItems(newOrderItems);

        // Send print requests to all selected printers
        for (const printerName of printerNames) {
          await sendPrintRequest(printerName, text);
        }

        // Clear the timeout since the operation completed
        clearTimeout(timeoutId);

        toast.dismiss(loadingToast);
        toast.success(`${itemsToPrint.length} item(ns) enviado(s) para impressão`);

        // Save the selected printers for future use
        setSelectedPrinters(printerNames);
      } catch (error: any) {
        console.error("Error printing:", error);
        toast.error(`Erro ao imprimir: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else if (printerNames.length === 0) {
      toast.error("Selecione pelo menos uma impressora para imprimir");
    } else {
      toast.error("Nenhum pedido encontrado para imprimir");
    }
  };

  const handleReprintItem = async (itemId: string) => {
    try {
      setLoading(true);

      // Find the item
      const item = orderItems.find(item => item.id === itemId);
      if (!item || !item.id) {
        toast.error("Item não encontrado");
        return;
      }

      // If the item is already printed, mark it as not printed (toggle)
      if (item.printed_at) {
        // Update in database - set printed_at to null
        const { data, error } = await supabase
          .from('order_items')
          .update({ printed_at: null })
          .eq('id', item.id)
          .select();

        if (error) throw error;

        // Update local state
        const updatedItems = orderItems.map(i =>
          i.id === itemId ? { ...i, printed_at: null } : i
        );
        setOrderItems(updatedItems);

        toast.success("Item marcado como não impresso");
        setLoading(false);
        return;
      }

      // If the item is not printed yet, print it
      if (!currentOrder || !table) {
        toast.error("Pedido ou mesa não encontrados");
        return;
      }

      // Generate print text for just this item
      const singleItemText = generateSingleItemPrintText(currentOrder, item, table);

      // If no printers are selected, open the printer selector
      if (selectedPrinters.length === 0) {
        // Store item ID to be printed after printer selection
        localStorage.setItem('pendingPrintItemId', itemId);
        setShowPrinterSelectorModal(true);
        setLoading(false);
        return;
      }

      // Show loading toast with timeout
      const loadingToast = toast.loading(`Enviando impressão para ${selectedPrinters.length} impressora${selectedPrinters.length > 1 ? 's' : ''}...`);

      // Set a timeout to dismiss the loading toast after 20 seconds
      const timeoutId = setTimeout(() => {
        toast.dismiss(loadingToast);
        toast.warning("A operação de impressão está demorando mais que o esperado. Verifique a impressora.");
      }, 20000); // 20 seconds

      // Update in database - set printed_at to current date
      const { data, error } = await supabase
        .from('order_items')
        .update({ printed_at: new Date().toISOString() })
        .eq('id', item.id)
        .select();

      if (error) throw error;

      // Update local state
      const updatedItems = orderItems.map(i =>
        i.id === itemId ? { ...i, printed_at: new Date().toISOString() } : i
      );
      setOrderItems(updatedItems);

      // Send print requests to all selected printers
      for (const printerName of selectedPrinters) {
        await sendPrintRequest(printerName, singleItemText);
      }

      // Clear the timeout since the operation completed
      clearTimeout(timeoutId);

      toast.dismiss(loadingToast);
      toast.success("Item enviado para impressão");
    } catch (error: any) {
      console.error("Erro ao processar item:", error);
      toast.error(`Erro ao processar item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePrintText = (order: Order, items: OrderItem[], table: Table | null) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Define receipt width and price column width
    const RECEIPT_WIDTH = 48; // Total width of the receipt in characters
    const PRICE_COLUMN_START = 38; // Position where price column starts
    const PRICE_WIDTH = 10; // Width of the price column

    // Helper function to format monetary values with proper alignment
    const formatMoneyValue = (value: number): string => {
      // Format with 2 decimal places and replace dot with comma
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    // Helper function to format text with proper alignment
    const formatLine = (leftText: string, rightText: string) => {
      // If the left text is too long, wrap it
      if (leftText.length > PRICE_COLUMN_START - 2) { // -2 for spacing
        // Split the left text into multiple lines
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

        // Format the first line with the price
        // Calculate spaces needed to align the price at the right edge
        const spacesNeeded = RECEIPT_WIDTH - lines[0].length - rightText.length;
        let result = lines[0] + ' '.repeat(spacesNeeded) + rightText + '\n';

        // Add the remaining lines without the price
        for (let i = 1; i < lines.length; i++) {
          result += lines[i] + '\n';
        }

        return result.trimEnd();
      }

      // Simple case: left text fits on one line
      // Calculate spaces needed to align the price at the right edge
      const spacesNeeded = RECEIPT_WIDTH - leftText.length - rightText.length;
      return leftText + ' '.repeat(spacesNeeded) + rightText;
    };

    const customerName = order.customer_name || '';
    let text = "";

    // Header
    text += "================================================\n";
    text += "              PEDIDO PARA COZINHA               \n";
    text += `              Pedido #${order.id?.substring(0, 8) || ''}               \n`;
    text += "================================================\n";
    text += `Data: ${dateStr} ${timeStr}            Mesa: ${table?.number || '-'}\n\n`;

    // Customer name if available
    if (customerName) {
      text += `Cliente: ${customerName}\n\n`;
    }

    // Items
    text += "ITENS DO PEDIDO:\n";
    text += "------------------------------------------------\n";

    items.forEach(item => {
      // Item name and price
      const itemText = `${item.quantity}x ${item.name}`;
      const priceText = formatMoneyValue(item.price * item.quantity);

      text += formatLine(itemText, priceText) + '\n';

      // Extras if available
      if (item.extras && item.extras.length > 0) {
        item.extras.forEach(extra => {
          const extraText = `+ ${extra.name}`;
          const extraPriceText = formatMoneyValue(extra.price * item.quantity);

          // Adicionar indentação antes do "+" para alinhar corretamente
          text += formatLine(`   ${extraText}`, extraPriceText) + '\n';
        });
      }

      // Observation if available
      if (item.observation) {
        // Formatar a observação da mesma forma que os extras, mas sem preço
        const obsText = `OBS: ${item.observation}`;
        text += formatLine(`   ${obsText}`, '') + '\n';
      }

      // Add a blank line between items
      text += "\n";
    });

    // Footer
    text += "------------------------------------------------\n";

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

    // Format the subtotal with right alignment
    const subtotalText = "SUBTOTAL:";
    const subtotalPriceText = formatMoneyValue(subtotal);
    text += formatLine(subtotalText, subtotalPriceText) + '\n';

    // Add service fee if applicable
    if (order.service_fee && order.service_fee > 0) {
      const serviceFeeText = "TAXA DE SERVIÇO (10%):";
      const serviceFeePriceText = formatMoneyValue(order.service_fee);
      text += formatLine(serviceFeeText, serviceFeePriceText) + '\n';

      // Add total with service fee
      const totalText = "TOTAL:";
      const totalPriceText = formatMoneyValue(subtotal + order.service_fee);
      text += formatLine(totalText, totalPriceText) + '\n';
    }

    text += "================================================\n";

    console.log("Cupom", text);

    return text;
  };

  const generateSingleItemPrintText = (order: Order, item: OrderItem, table: Table | null) => {
    const restaurantName = currentRestaurant?.name || "Restaurante";
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    let text = "";

    // Header
    text += `${restaurantName}\n`;
    text += "--------------------------------\n";
    text += `Data: ${dateStr} - ${timeStr}\n`;
    text += `Mesa: ${table ? table.number : "N/A"}\n`;
    text += `Cliente: ${order.customer_name || "Não informado"}\n`;
    text += `Pedido #: ${order.id?.substring(0, 8) || "Novo"}\n`;
    text += "--------------------------------\n";
    text += "IMPRESSÃO DE ITEM\n";
    text += "--------------------------------\n\n";

    // Item details
    text += `${item.quantity}x ${item.name}\n`;

    if (item.observation) {
      text += `  Obs: ${item.observation}\n`;
    }

    if (item.extras && item.extras.length > 0) {
      item.extras.forEach(extra => {
        text += `  + ${extra.name}\n`;
      });
    }

    text += "\n--------------------------------\n";

    console.log("Cupom", text);

    return text;
  };

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
      const url = `https://${printerConfig.ip_address}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

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
