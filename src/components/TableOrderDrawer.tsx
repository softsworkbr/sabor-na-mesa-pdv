import React, { useState, useEffect, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  FileText,
  Loader2,
  Tag,
  Check,
  X,
  Filter,
  List,
  Grid3X3,
  ChevronDown,
  Banknote,
  QrCode,
  CreditCard as CreditCardIcon,
  Receipt,
  Ticket,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useIsMobile, useIsSmallMobile } from "@/hooks/use-mobile";
import OrderProduct from "./OrderProduct";
import PaymentModal from "./PaymentModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import { 
  TableOrderTable, 
  updateTable,
  ProductCategory,
  Product,
  ProductExtra
} from "@/utils/restaurant";
import { 
  createOrder, 
  getOrderByTableId,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  calculateOrderTotal
} from "@/utils/restaurant/orderManagement";
import { Order, OrderItem, PaymentEntry } from "@/utils/restaurant/orderTypes";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableOrderTable | null;
}

const sampleProducts: Product[] = [
  { id: "1", category_id: "cervejas", name: "Heineken zero", price: 9.50, restaurant_id: "" },
  { id: "2", category_id: "cervejas", name: "Brahma 600ml", price: 9.90, restaurant_id: "" },
  { id: "3", category_id: "cervejas", name: "Original 600ml", price: 12.50, restaurant_id: "" },
  { id: "4", category_id: "cervejas", name: "Serramalte 600ml", price: 12.50, restaurant_id: "" },
  { id: "5", category_id: "cervejas", name: "Budweiser long", price: 9.50, restaurant_id: "" },
  { id: "6", category_id: "cervejas", name: "Cabare", price: 9.90, restaurant_id: "" },
  { id: "7", category_id: "cervejas", name: "Heineken 600", price: 15.00, restaurant_id: "" },
  { id: "8", category_id: "cervejas", name: "Heineken long", price: 9.50, restaurant_id: "" },
  { id: "9", category_id: "cervejas", name: "Malzbier", price: 9.50, restaurant_id: "" },
  { id: "10", category_id: "cervejas", name: "Originalzinha", price: 8.00, restaurant_id: "" },
  { id: "11", category_id: "refrigerantes", name: "Coca-Cola 600ml", price: 7.50, restaurant_id: "" },
  { id: "12", category_id: "refrigerantes", name: "Guaraná Antarctica", price: 7.50, restaurant_id: "" },
  { id: "13", category_id: "suco", name: "Suco de Laranja", price: 9.00, restaurant_id: "" },
  { id: "14", category_id: "caipirinha", name: "Caipirinha de Limão", price: 15.00, restaurant_id: "" },
  { id: "15", category_id: "saladas", name: "Salada Caesar", price: 25.00, restaurant_id: "" },
  { id: "16", category_id: "picanha", name: "Picanha ao Ponto", price: 89.90, restaurant_id: "" },
  { id: "17", category_id: "file_mignon", name: "Filé Mignon", price: 79.90, restaurant_id: "" },
  { id: "18", category_id: "massas", name: "Espaguete à Bolonhesa", price: 45.00, restaurant_id: "" },
  { id: "19", category_id: "file_frango", name: "Filé de Frango Grelhado", price: 39.90, restaurant_id: "" },
  { id: "20", category_id: "file_saint", name: "Filé de Saint Peter", price: 52.90, restaurant_id: "" },
];

const productCategories: ProductCategory[] = [
  { id: "todas", name: "Todas", color: "bg-white", textColor: "text-black", restaurant_id: "" },
  { id: "cervejas", name: "Cervejas", color: "bg-cyan-500", textColor: "text-white", restaurant_id: "" },
  { id: "refrigerantes", name: "Refrigerantes e suco", color: "bg-teal-500", textColor: "text-white", restaurant_id: "" },
  { id: "suco", name: "Suco de jarra", color: "bg-emerald-400", textColor: "text-white", restaurant_id: "" },
  { id: "caipirinha", name: "Caipirinha", color: "bg-lime-400", textColor: "text-black", restaurant_id: "" },
  { id: "saladas", name: "Saladas", color: "bg-amber-400", textColor: "text-black", restaurant_id: "" },
  { id: "file_mignon", name: "Filé Mignon", color: "bg-orange-400", textColor: "text-black", restaurant_id: "" },
  { id: "picanha", name: "Picanha", color: "bg-orange-500", textColor: "text-white", restaurant_id: "" },
  { id: "file_frango", name: "Filé de Frango", color: "bg-rose-500", textColor: "text-white", restaurant_id: "" },
  { id: "file_saint", name: "Filé de Saint Peter", color: "bg-pink-700", textColor: "text-white", restaurant_id: "" },
  { id: "massas", name: "Massas", color: "bg-purple-600", textColor: "text-white", restaurant_id: "" },
  { id: "pratos_kids", name: "Pratos kids", color: "bg-blue-400", textColor: "text-white", restaurant_id: "" },
  { id: "lanche_file", name: "Lanche de Filé Mignon", color: "bg-slate-600", textColor: "text-white", restaurant_id: "" },
  { id: "lanche_frango", name: "Lanche de Frango", color: "bg-teal-600", textColor: "text-white", restaurant_id: "" },
  { id: "lanche_hamburger", name: "Lanche de hambúrguer", color: "bg-emerald-800", textColor: "text-white", restaurant_id: "" },
  { id: "lanches_especiais", name: "Lanches especiais", color: "bg-lime-300", textColor: "text-black", restaurant_id: "" },
  { id: "outros", name: "Outros", color: "bg-yellow-400", textColor: "text-black", restaurant_id: "" },
];

interface TableOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableOrderTable | null;
}

const TableOrderDrawer = ({ isOpen, onClose, table }: TableOrderDrawerProps) => {
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

  const loadTableOrder = async () => {
    if (!table || !table.id) return;
    
    setLoading(true);
    try {
      const tableId = table.id;
      
      const order = await getOrderByTableId(tableId);
      
      if (order) {
        setCurrentOrder(order);
        setOrderId(order.id);

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

      await calculateOrderTotal(currentOrderId);
      toast.success(`"${product.name}" adicionado ao pedido.`);
    } catch (error) {
      console.error("Error adding product to order:", error);
      toast.error("Erro ao adicionar produto");
    }
  };

  const handleAddProduct = async (productId: string, withOptions: boolean = false) => {
    if (isTableBlocked) {
      toast.error("Esta mesa está bloqueada para fechamento. Não é possível adicionar itens.");
      return;
    }

    const productsToSearch = realProducts.length > 0 ? realProducts : sampleProducts;
    const product = productsToSearch.find(p => p.id === productId);
    if (!product) return;

    setSelectedProduct(product);
    setObservation("");
    setSelectedExtras([]);

    const productHasExtras = product.category?.has_extras || false;
    
    if (withOptions) {
      if (productHasExtras) {
        const extras = await fetchProductExtras(productId);
        setAvailableExtras(extras);
        
        if (extras.length > 0) {
          setShowExtrasModal(true);
        } else {
          setShowObservationModal(true);
        }
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
      
      if (orderId) {
        await calculateOrderTotal(orderId);
      }
      
      toast.success("Item removido do pedido");
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error("Erro ao remover item");
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
      
      if (orderId) {
        await calculateOrderTotal(orderId);
      }
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

  const categoriesToUse = realCategories.length > 0 ? realCategories : productCategories;
  const productsToUse = realProducts.length > 0 ? realProducts : sampleProducts;

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

  const handlePaymentComplete = (payments: PaymentEntry[]) => {
    // Here you would update the order status, process the payment in your database, etc.
    if (table?.id && orderId) {
      // Update table status
      updateTable(table.id, { status: "free" })
        .then(() => {
          // You would also update the order status to completed/paid
          toast.success("Mesa liberada com sucesso");
          onClose();
        })
        .catch(error => {
          console.error("Error updating table status:", error);
          toast.error("Erro ao liberar mesa");
        });
    }
  };

  const ExtrasModal = () => {
    const [localExtras, setLocalExtras] = useState<ProductExtra[]>([]);
    
    React.useEffect(() => {
      if (showExtrasModal) {
        setLocalExtras(selectedExtras);
      }
    }, [showExtrasModal, selectedExtras]);
    
    const handleCloseExtrasModal = () => {
      setShowExtrasModal(false);
      setSelectedExtras([]);
    };
    
    const handleContinueToObservation = () => {
      setSelectedExtras([...localExtras]);
      setShowExtrasModal(false);
      setShowObservationModal(true);
    };
    
    const handleAddWithExtras = () => {
      const extrasToSave = [...localExtras];
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
    };
    
    const toggleExtra = (extra: ProductExtra) => {
      setLocalExtras(prevExtras => {
        const isSelected = prevExtras.some(e => e.id === extra.id);
        
        if (isSelected) {
          return prevExtras.filter(e => e.id !== extra.id);
        } else {
          return [...prevExtras, extra];
        }
      });
    };
    
    const calculateTotalPrice = () => {
      if (!selectedProduct) return 0;
      
      let total = selectedProduct.price;
      localExtras.forEach(extra => {
        total += extra.price;
      });
      
      return total;
    };

    if (!showExtrasModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div 
          className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6 max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg md:text-xl font-bold">Selecionar Adicionais</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              onClick={handleCloseExtrasModal}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 mb-3">
            Adicione adicionais para personalizar este produto
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-base md:text-lg font-medium">{selectedProduct?.name}</p>
              <p className="text-sm text-gray-500">Preço base: R$ {selectedProduct?.price.toFixed(2).replace('.', ',')}</p>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="font-medium flex items-center mb-2 text-sm md:text-base">
                <Tag className="h-4 w-4 mr-2" />
                <span>Adicionais disponíveis</span>
              </div>
              
              <div className="space-y-2 max-h-[35vh] md:max-h-60 overflow-y-auto pr-1">
                {availableExtras.map(extra => {
                  const isSelected = localExtras.some(e => e.id === extra.id);
                  return (
                    <div 
                      key={extra.id} 
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div 
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                        onClick={() => toggleExtra(extra)}
                      >
                        <div 
                          className={`h-5 w-5 rounded-sm border flex-shrink-0 ${
                            isSelected 
                              ? 'bg-primary border-primary text-white flex items-center justify-center' 
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm font-medium line-clamp-2">
                          {extra.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium ml-2 whitespace-nowrap">+ R$ {extra.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  );
                })}
              </div>
              
              {availableExtras.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Nenhum adicional disponível para este produto.
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between">
                <span className="font-medium">Total com adicionais:</span>
                <span className="font-bold">R$ {calculateTotalPrice().toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {localExtras.length} adicional(is) selecionado(s)
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={handleCloseExtrasModal}
              className="md:order-1"
            >
              Cancelar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleContinueToObservation}
              className="md:order-2"
            >
              Adicionar Observação
            </Button>
            <Button 
              onClick={handleAddWithExtras}
              className="md:order-3 bg-primary hover:bg-primary/90"
            >
              Adicionar ao pedido
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const ObservationModal = () => {
    const [localObservation, setLocalObservation] = useState("");
    
    React.useEffect(() => {
      if (showObservationModal) {
        setLocalObservation(observation);
      }
    }, [showObservationModal, observation]);

    const handleCloseModal = () => {
      setShowObservationModal(false);
    };

    const handleAddWithObservation = () => {
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
    };

    if (!showObservationModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div 
          className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6 max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg md:text-xl font-bold">Adicionar Observação</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              onClick={handleCloseModal}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 mb-3">
            Adicione uma observação para este produto
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-base md:text-lg font-medium">{selectedProduct?.name}</p>
              <p className="text-sm text-gray-500">Preço: R$ {selectedProduct?.price.toFixed(2).replace('.', ',')}</p>
              
              {selectedExtras.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Adicionais selecionados:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedExtras.map(extra => (
                      <span key={extra.id} className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                        {extra.name} (+{extra.price.toFixed(2).replace('.', ',')})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="observation" className="text-sm font-medium">
                Observação para o preparo:
              </label>
              <textarea
                id="observation"
                placeholder="Ex: Sem cebola com creme, com cebolinha papai, bem passado, etc..."
                value={localObservation}
                onChange={(e) => setLocalObservation(e.target.value)}
                className="min-h-[80px] w-full resize
