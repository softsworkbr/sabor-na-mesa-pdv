import React, { useState, useEffect } from "react";
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
  FileText,
  Loader2
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
import { 
  TableOrderTable, 
  updateTable,
  ProductCategory,
  Product
} from "@/utils/restaurant";
import { 
  createOrder, 
  getOrderByTableId,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  calculateOrderTotal
} from "@/utils/restaurant/orderManagement";
import { Order, OrderItem } from "@/utils/restaurant/orderTypes";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

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

  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  useEffect(() => {
    if (isOpen && table?.id) {
      fetchProductCategories();
    }
  }, [isOpen, table]);

  useEffect(() => {
    if (isOpen && table) {
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

  const handleAddProduct = async (productId: string, withObservation: boolean = false) => {
    const productsToSearch = realProducts.length > 0 ? realProducts : sampleProducts;
    const product = productsToSearch.find(p => p.id === productId);
    if (!product) return;

    if (withObservation) {
      setSelectedProduct(product);
      setObservation("");
      setShowObservationModal(true);
      return;
    }

    await addProductToOrder(product);
  };

  const addProductToOrder = async (product: Product, productObservation?: string) => {
    try {
      let currentOrderId = orderId;
      if (!currentOrderId) {
        currentOrderId = await saveOrder();
        if (!currentOrderId) {
          toast.error("Não foi possível criar o pedido");
          return;
        }
      }

      const existingItemIndex = orderItems.findIndex(item => 
        item.product_id === product.id && item.observation === productObservation
      );

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
          price: product.price,
          quantity: 1,
          observation: productObservation || null
        });
        
        setOrderItems([...orderItems, newItem]);
      }

      await calculateOrderTotal(currentOrderId);
      toast.success(`"${product.name}" adicionado ao pedido.`);
    } catch (error) {
      console.error("Error adding product to order:", error);
      toast.error("Erro ao adicionar produto");
    }
  };

  const handleAddProductWithObservation = async () => {
    if (!selectedProduct) return;
    
    await addProductToOrder(selectedProduct, observation);
    setShowObservationModal(false);
    setSelectedProduct(null);
    setObservation("");
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

  const ObservationModal = () => {
    const [localObservation, setLocalObservation] = useState(observation);

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
      handleAddProductWithObservation();
    };

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
              <textarea
                id="observation"
                placeholder="Ex: Sem cebola com creme, com cebolinha papai, bem passado, etc..."
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

  const ProductsView = () => {
    if (searchQuery.trim() !== "") {
      return (
        <div className="overflow-y-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-100">
              <TableRow>
                <TableHead className="w-24">Categoria</TableHead>
                <TableHead className="w-20">Código</TableHead>
                <TableHead>Nome do Produto</TableHead>
                <TableHead className="w-28">Preço de Venda</TableHead>
                <TableHead className="w-20 text-center">Adicionar</TableHead>
                <TableHead className="w-32 text-center">Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const category = categoriesToUse.find(c => c.id === product.category_id);
                return (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="py-1">{category?.name.split(' ')[0]}</TableCell>
                    <TableCell className="py-1">{product.id}</TableCell>
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
      );
    }

    return (
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
    );
  };

  const CategoryProductGroup = ({ category, products, onAddProduct }: { 
    category?: ProductCategory; 
    products: Product[];
    onAddProduct: (id: string, withObservation?: boolean) => void;
  }) => {
    if (!category) return null;
    
    return (
      <div className="mb-6">
        <div className={`${category.color || 'bg-gray-200'} ${category.textColor || 'text-gray-800'} px-4 py-2 rounded-lg mb-3`}>
          <h3 className="font-bold">{category.name}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg bg-white shadow-sm p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{product.name}</h4>
                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                  )}
                  <p className="text-lg font-bold mt-1">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-gray-100"
                    onClick={() => onAddProduct(product.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-gray-100"
                    onClick={() => onAddProduct(product.id, true)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Content = () => (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : currentStep === "order" ? (
        <div className="flex flex-col h-full">
          <div className="bg-gray-100 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="text-5xl font-bold text-green-700">{table?.number.toString().padStart(2, '0')}</div>
                <div className="ml-4">
                  <div className="text-lg">
                    {orderId ? `Pedido #${orderId.substring(0, 8)}` : "Novo Pedido"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentOrder?.created_at 
                      ? `Iniciado em ${new Date(currentOrder.created_at).toLocaleDateString()} às ${new Date(currentOrder.created_at).toLocaleTimeString().substring(0, 5)}`
                      : `${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString().substring(0, 5)}`
                    }
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
                    <span className="font-semibold">
                      {orderId ? orderId.substring(0, 5) : Math.floor(10000 + Math.random() * 90000)}
                    </span>
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
                        key={`${item.id || item.product_id}-${index}-${item.observation || "no-obs"}`}
                        item={item}
                        onChangeQuantity={(newQuantity) => item.id && handleChangeQuantity(item.id, newQuantity)}
                        onRemove={() => item.id && handleRemoveProduct(item.id)}
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
            <div className="flex items-center gap-2 w-1/3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex h-[calc(100vh-200px)] overflow-hidden">
            <div className="w-64 border-r overflow-y-auto">
              {categoriesToUse.map((category) => (
                <div
                  key={category.id}
                  className={`${category.color || 'bg-gray-200'} ${category.textColor || 'text-gray-800'} border-b border-gray-300 cursor-pointer hover:opacity-90 transition-colors`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <div className={`p-4 flex items-center ${activeCategory === category.id ? 'font-bold' : ''}`}>
                    <div className="mr-2">
                      {category.id === "todas" ? "•" : ""}
                    </div>
                    <div>{category.name}</div>
                  </div>
                </div>
              ))}
            </div>

            <ProductsView />
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
        {Content()}
      </DialogContent>
    </Dialog>
  );
};

export default TableOrderDrawer;
