
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Coffee,
  UtensilsCrossed,
  Wine,
  IceCream,
  Pizza,
  Salad,
  Utensils,
  X,
  Save,
  Loader2,
  AlertTriangle,
  Image,
  Tag,
  DollarSign,
  PlusCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByRestaurant,
  getProductsByCategory,
  CreateProductProps,
  UpdateProductProps,
  createProductExtra,
  updateProductExtra,
  deleteProductExtra,
  getProductExtrasByRestaurant,
  getProductExtrasByCategory,
  assignExtrasToProduct,
  getProductExtras
} from "@/utils/restaurant/restaurantManagement";
import { ProductExtra } from "@/utils/restaurant/productTypes";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  restaurant_id: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  product_categories?: {
    name: string;
  }
}

interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  restaurant_id: string;
  has_extras: boolean;
  active: boolean;
  sort_order: number;
}

const categorySchema = z.object({
  name: z.string().min(1, { message: "Nome da categoria é obrigatório" }),
  description: z.string().optional(),
  has_extras: z.boolean().default(false),
  active: z.boolean().default(true),
  sort_order: z.number().default(0),
});

const productSchema = z.object({
  name: z.string().min(1, { message: "Nome do produto é obrigatório" }),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, { message: "Preço deve ser maior que zero" }),
  category_id: z.string().min(1, { message: "Categoria é obrigatória" }),
  image_url: z.string().optional(),
  active: z.boolean().default(true),
});

const extraSchema = z.object({
  name: z.string().min(1, { message: "Nome do adicional é obrigatório" }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, { message: "Preço não pode ser negativo" }),
  category_id: z.string().optional(),
  active: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type ProductFormValues = z.infer<typeof productSchema>;
type ExtraFormValues = z.infer<typeof extraSchema>;

const MenuPage = () => {
  const { currentRestaurant } = useAuth();
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("products");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showExtraDialog, setShowExtraDialog] = useState(false);
  const [showProductExtras, setShowProductExtras] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [editingExtra, setEditingExtra] = useState<ProductExtra | null>(null);
  const [selectedProductForExtras, setSelectedProductForExtras] = useState<MenuItem | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [showCategoriesTab, setShowCategoriesTab] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [extraToDelete, setExtraToDelete] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [availableExtras, setAvailableExtras] = useState<ProductExtra[]>([]);
  
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      has_extras: false,
      active: true,
      sort_order: 0,
    },
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: "",
      image_url: "",
      active: true,
    },
  });

  const extraForm = useForm<ExtraFormValues>({
    resolver: zodResolver(extraSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: "",
      active: true,
    },
  });

  useEffect(() => {
    if (currentRestaurant) {
      fetchProductCategories();
      if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'extras') {
        fetchExtras();
      }
    }
  }, [currentRestaurant, activeTab]);

  const fetchProductCategories = async () => {
    if (!currentRestaurant) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setProductCategories(data || []);
    } catch (error: any) {
      toast.error(`Erro ao carregar categorias: ${error.message}`);
      console.error('Error fetching product categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!currentRestaurant) return;
    
    setIsLoading(true);
    try {
      const data = await getProductsByRestaurant(currentRestaurant.id);
      setProducts(data as MenuItem[]);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExtras = async () => {
    if (!currentRestaurant) return;
    
    setIsLoading(true);
    try {
      const data = await getProductExtrasByRestaurant(currentRestaurant.id);
      setExtras(data as ProductExtra[]);
    } catch (error: any) {
      console.error('Error fetching extras:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductsByCategory = async (categoryId: string) => {
    if (!currentRestaurant || categoryId === 'all') {
      fetchProducts();
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await getProductsByCategory(currentRestaurant.id, categoryId);
      setProducts(data as MenuItem[]);
    } catch (error: any) {
      console.error('Error fetching products by category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExtrasByCategory = async (categoryId: string) => {
    if (!currentRestaurant || categoryId === 'all') {
      fetchExtras();
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await getProductExtrasByCategory(currentRestaurant.id, categoryId);
      setExtras(data as ProductExtra[]);
    } catch (error: any) {
      console.error('Error fetching extras by category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentRestaurant) {
      if (activeTab === 'products') {
        if (activeCategory === 'all') {
          fetchProducts();
        } else {
          fetchProductsByCategory(activeCategory);
        }
      } else if (activeTab === 'extras') {
        if (activeCategory === 'all') {
          fetchExtras();
        } else {
          fetchExtrasByCategory(activeCategory);
        }
      }
    }
  }, [activeCategory, currentRestaurant, activeTab]);

  const openCategoryDialog = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        description: category.description || "",
        has_extras: category.has_extras,
        active: category.active,
        sort_order: category.sort_order,
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset({
        name: "",
        description: "",
        has_extras: false,
        active: true,
        sort_order: productCategories.length,
      });
    }
    setShowCategoryDialog(true);
  };

  const openProductDialog = (product?: MenuItem) => {
    if (product) {
      setEditingProduct(product);
      productForm.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        category_id: product.category_id,
        image_url: product.image_url || "",
        active: product.active,
      });
    } else {
      setEditingProduct(null);
      productForm.reset({
        name: "",
        description: "",
        price: 0,
        category_id: activeCategory !== 'all' ? activeCategory : "",
        image_url: "",
        active: true,
      });
    }
    setShowProductDialog(true);
  };

  const openExtraDialog = (extra?: ProductExtra) => {
    if (extra) {
      setEditingExtra(extra);
      extraForm.reset({
        name: extra.name,
        description: extra.description || "",
        price: extra.price,
        category_id: extra.category_id || "",
        active: extra.active,
      });
    } else {
      setEditingExtra(null);
      extraForm.reset({
        name: "",
        description: "",
        price: 0,
        category_id: activeCategory !== 'all' ? activeCategory : "",
        active: true,
      });
    }
    setShowExtraDialog(true);
  };

  const openProductExtrasDialog = async (product: MenuItem) => {
    setSelectedProductForExtras(product);
    setIsLoading(true);
    
    try {
      // Fetch all available extras
      const allExtras = await getProductExtrasByRestaurant(currentRestaurant!.id);
      setAvailableExtras(allExtras as ProductExtra[]);
      
      // Fetch extras already assigned to this product
      const productExtras = await getProductExtras(product.id);
      setSelectedExtras(productExtras.map(extra => extra.id));
    } catch (error) {
      console.error("Error loading product extras:", error);
      toast.error("Erro ao carregar adicionais do produto");
    } finally {
      setIsLoading(false);
      setShowProductExtras(true);
    }
  };

  const closeCategoryDialog = () => {
    setShowCategoryDialog(false);
    setEditingCategory(null);
  };

  const closeProductDialog = () => {
    setShowProductDialog(false);
    setEditingProduct(null);
  };

  const closeExtraDialog = () => {
    setShowExtraDialog(false);
    setEditingExtra(null);
  };

  const closeProductExtrasDialog = () => {
    setShowProductExtras(false);
    setSelectedProductForExtras(null);
    setSelectedExtras([]);
  };

  const onSaveCategory = async (values: CategoryFormValues) => {
    if (!currentRestaurant) {
      toast.error("Nenhum restaurante selecionado");
      return;
    }

    setIsLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('product_categories')
          .update({
            name: values.name,
            description: values.description || null,
            has_extras: values.has_extras,
            active: values.active,
            sort_order: values.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        toast.success("Categoria atualizada com sucesso!");
      } else {
        // Create new category
        const { error } = await supabase
          .from('product_categories')
          .insert({
            name: values.name,
            description: values.description || null,
            restaurant_id: currentRestaurant.id,
            has_extras: values.has_extras,
            active: values.active,
            sort_order: values.sort_order,
          });
        
        if (error) throw error;
        toast.success("Categoria criada com sucesso!");
      }
      
      // Refresh categories list
      await fetchProductCategories();
      closeCategoryDialog();
    } catch (error: any) {
      toast.error(`Erro ao salvar categoria: ${error.message}`);
      console.error('Error saving product category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSaveProduct = async (values: ProductFormValues) => {
    if (!currentRestaurant) {
      toast.error("Nenhum restaurante selecionado");
      return;
    }

    setIsLoading(true);
    try {
      const productData = {
        name: values.name,
        description: values.description || null,
        price: values.price,
        category_id: values.category_id,
        restaurant_id: currentRestaurant.id,
        image_url: values.image_url || null,
        active: values.active,
      };

      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, productData);
      } else {
        // Create new product
        await createProduct(productData);
      }
      
      // Refresh products list
      if (activeCategory === 'all') {
        await fetchProducts();
      } else {
        await fetchProductsByCategory(activeCategory);
      }
      
      closeProductDialog();
    } catch (error: any) {
      toast.error(`Erro ao salvar produto: ${error.message}`);
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSaveExtra = async (values: ExtraFormValues) => {
    if (!currentRestaurant) {
      toast.error("Nenhum restaurante selecionado");
      return;
    }

    setIsLoading(true);
    try {
      const extraData = {
        name: values.name,
        description: values.description || null,
        price: values.price,
        category_id: values.category_id || null,
        restaurant_id: currentRestaurant.id,
        active: values.active,
      };

      if (editingExtra) {
        // Update existing extra
        await updateProductExtra(editingExtra.id, extraData);
      } else {
        // Create new extra
        await createProductExtra(extraData);
      }
      
      // Refresh extras list
      if (activeCategory === 'all') {
        await fetchExtras();
      } else {
        await fetchExtrasByCategory(activeCategory);
      }
      
      closeExtraDialog();
    } catch (error: any) {
      toast.error(`Erro ao salvar adicional: ${error.message}`);
      console.error('Error saving product extra:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSaveProductExtras = async () => {
    if (!selectedProductForExtras || !currentRestaurant) return;
    
    setIsLoading(true);
    try {
      await assignExtrasToProduct(selectedProductForExtras.id, selectedExtras);
      toast.success("Adicionais atribuídos com sucesso!");
      closeProductExtrasDialog();
    } catch (error) {
      console.error("Error saving product extras:", error);
      toast.error("Erro ao salvar adicionais");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setProductToDelete(null);
    setExtraToDelete(null);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = (productId: string) => {
    setProductToDelete(productId);
    setCategoryToDelete(null);
    setExtraToDelete(null);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteExtra = (extraId: string) => {
    setExtraToDelete(extraId);
    setCategoryToDelete(null);
    setProductToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      if (categoryToDelete) {
        const { error } = await supabase
          .from('product_categories')
          .delete()
          .eq('id', categoryToDelete);
        
        if (error) throw error;
        
        toast.success("Categoria excluída com sucesso!");
        await fetchProductCategories();
        setCategoryToDelete(null);
      } else if (productToDelete) {
        await deleteProduct(productToDelete);
        
        if (activeCategory === 'all') {
          await fetchProducts();
        } else {
          await fetchProductsByCategory(activeCategory);
        }
        setProductToDelete(null);
      } else if (extraToDelete) {
        await deleteProductExtra(extraToDelete);
        
        if (activeCategory === 'all') {
          await fetchExtras();
        } else {
          await fetchExtrasByCategory(activeCategory);
        }
        setExtraToDelete(null);
      }
    } catch (error: any) {
      toast.error(`Erro ao excluir: ${error.message}`);
      console.error('Error deleting:', error);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const toggleExtraSelection = (extraId: string) => {
    setSelectedExtras(prevSelected => 
      prevSelected.includes(extraId)
        ? prevSelected.filter(id => id !== extraId)
        : [...prevSelected, extraId]
    );
  };

  const filteredProducts = products.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredExtras = extras.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cardápio</h1>
          <p className="text-muted-foreground">
            Gerencie os itens do cardápio.
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCategoriesTab(!showCategoriesTab)}
            className="mr-2"
          >
            {showCategoriesTab ? "Ver Produtos" : "Gerenciar Categorias"}
          </Button>
          {!showCategoriesTab && (
            <Button 
              variant="outline" 
              onClick={() => setActiveTab(activeTab === 'products' ? 'extras' : 'products')}
              className="mr-2"
            >
              {activeTab === 'products' ? "Ver Adicionais" : "Ver Produtos"}
            </Button>
          )}
          <Button 
            className="bg-pos-primary hover:bg-pos-primary/90"
            onClick={() => {
              if (showCategoriesTab) {
                openCategoryDialog();
              } else if (activeTab === 'products') {
                openProductDialog();
              } else {
                openExtraDialog();
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> 
            {showCategoriesTab 
              ? "Nova Categoria" 
              : activeTab === 'products' 
                ? "Novo Produto" 
                : "Novo Adicional"
            }
          </Button>
        </div>
      </div>
      
      {showCategoriesTab ? (
        <div className="bg-white rounded-md shadow">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Categorias de Produtos</h2>
            
            {isLoading && <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-pos-primary" />
            </div>}
            
            {!isLoading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Possui Extras</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma categoria encontrada. Crie sua primeira categoria clicando em "Nova Categoria".
                      </TableCell>
                    </TableRow>
                  ) : (
                    productCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || "-"}</TableCell>
                        <TableCell>
                          <Switch checked={category.has_extras} disabled />
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {category.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell>{category.sort_order}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCategoryDialog(category)}
                            className="text-yellow-600 mr-1"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDeleteCategory(category.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder={`Buscar ${activeTab === 'products' ? 'produtos' : 'adicionais'}...`} 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-4 flex overflow-x-auto pb-px">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {productCategories.filter(cat => cat.active).map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {activeTab === 'products' ? (
              <TabsContent value="all" className="p-0">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-pos-primary" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        Nenhum produto encontrado. Adicione produtos clicando em "Novo Produto".
                      </div>
                    ) : (
                      filteredProducts.map(product => (
                        <MenuItemCard 
                          key={product.id} 
                          item={product} 
                          onEdit={() => openProductDialog(product)}
                          onDelete={() => confirmDeleteProduct(product.id)}
                          onManageExtras={() => openProductExtrasDialog(product)}
                        />
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
            ) : (
              <TabsContent value="all" className="p-0">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-pos-primary" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredExtras.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        Nenhum adicional encontrado. Adicione adicionais clicando em "Novo Adicional".
                      </div>
                    ) : (
                      filteredExtras.map(extra => (
                        <ExtraItemCard 
                          key={extra.id} 
                          item={extra} 
                          onEdit={() => openExtraDialog(extra)}
                          onDelete={() => confirmDeleteExtra(extra.id)}
                          categories={productCategories}
                        />
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
            )}
            
            {productCategories.filter(cat => cat.active).map(category => (
              <TabsContent key={category.id} value={category.id} className="p-0">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-pos-primary" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeTab === 'products' ? (
                      filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          Nenhum produto encontrado nesta categoria. Adicione produtos clicando em "Novo Produto".
                        </div>
                      ) : (
                        filteredProducts.map(product => (
                          <MenuItemCard 
                            key={product.id} 
                            item={product} 
                            onEdit={() => openProductDialog(product)}
                            onDelete={() => confirmDeleteProduct(product.id)}
                            onManageExtras={() => openProductExtrasDialog(product)}
                          />
                        ))
                      )
                    ) : (
                      filteredExtras.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          Nenhum adicional encontrado nesta categoria. Adicione adicionais clicando em "Novo Adicional".
                        </div>
                      ) : (
                        filteredExtras.map(extra => (
                          <ExtraItemCard 
                            key={extra.id} 
                            item={extra}
                            onEdit={() => openExtraDialog(extra)}
                            onDelete={() => confirmDeleteExtra(extra.id)}
                            categories={productCategories}
                          />
                        ))
                      )
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* Category Edit/Create Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={closeCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSaveCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da categoria (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FormField
                    control={categoryForm.control}
                    name="has_extras"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Possui Extras/Adicionais</FormLabel>
                          <FormDescription>
                            Produtos desta categoria podem ter itens adicionais
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="bg-gray-300 data-[state=checked]:bg-pos-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={categoryForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Categoria Ativa</FormLabel>
                      <FormDescription>
                        Categorias inativas não são exibidas no cardápio
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="bg-gray-300 data-[state=checked]:bg-green-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem de Exibição</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormDescription>
                      Números menores aparecem primeiro
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={closeCategoryDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-pos-primary hover:bg-pos-primary/90"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Product Edit/Create Dialog */}
      <Dialog open={showProductDialog} onOpenChange={closeProductDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onSaveProduct)} className="space-y-4">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do produto (opcional)" 
                        rows={3} 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productCategories.map(category => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={productForm.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="URL da imagem (opcional)" 
                          {...field} 
                          value={field.value || ''}
                        />
                        {field.value && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              field.onChange('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Adicione o link da imagem do produto
                    </FormDescription>
                    {field.value && (
                      <div className="mt-2 border rounded-md overflow-hidden w-20 h-20 relative">
                        <img 
                          src={field.value} 
                          alt="Prévia" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Erro';
                          }}
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Produto Ativo</FormLabel>
                      <FormDescription>
                        Produtos inativos não são exibidos no cardápio
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="bg-gray-300 data-[state=checked]:bg-green-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={closeProductDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-pos-primary hover:bg-pos-primary/90"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Extra Edit/Create Dialog */}
      <Dialog open={showExtraDialog} onOpenChange={closeExtraDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingExtra ? "Editar Adicional" : "Novo Adicional"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...extraForm}>
            <form onSubmit={extraForm.handleSubmit(onSaveExtra)} className="space-y-4">
              <FormField
                control={extraForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do adicional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={extraForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descrição do adicional (opcional)" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={extraForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={extraForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria (opcional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sem categoria</SelectItem>
                          {productCategories.map(category => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Pode ser agrupado por categoria
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={extraForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Adicional Ativo</FormLabel>
                      <FormDescription>
                        Adicionais inativos não são exibidos no cardápio
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="bg-gray-300 data-[state=checked]:bg-green-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={closeExtraDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-pos-primary hover:bg-pos-primary/90"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingExtra ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Product Extras Dialog */}
      <Dialog open={showProductExtras} onOpenChange={closeProductExtrasDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Adicionais para {selectedProductForExtras?.name}
            </DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-pos-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {availableExtras.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum adicional disponível. Crie adicionais primeiro.
                  </div>
                ) : (
                  availableExtras.map(extra => (
                    <div 
                      key={extra.id}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        selectedExtras.includes(extra.id) ? 'border-pos-primary bg-pos-primary/5' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{extra.name}</p>
                          <div className="text-right">
                            <p className="font-semibold text-pos-primary">
                              {extra.price ? `+ R$ ${extra.price.toFixed(2)}` : 'Grátis'}
                            </p>
                          </div>
                        </div>
                        {extra.description && (
                          <p className="text-sm text-muted-foreground">{extra.description}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          type="button"
                          variant={selectedExtras.includes(extra.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleExtraSelection(extra.id)}
                          className={selectedExtras.includes(extra.id) ? "bg-pos-primary" : ""}
                        >
                          {selectedExtras.includes(extra.id) ? (
                            <>Selecionado</>
                          ) : (
                            <>Selecionar</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={closeProductExtrasDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-pos-primary hover:bg-pos-primary/90"
                  onClick={onSaveProductExtras}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Adicionais
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete 
                ? "Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
                : productToDelete
                  ? "Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
                  : "Tem certeza que deseja excluir este adicional? Esta ação não pode ser desfeita."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCategoryToDelete(null);
              setProductToDelete(null);
              setExtraToDelete(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const MenuItemCard = ({ 
  item, 
  onEdit,
  onDelete,
  onManageExtras
}: { 
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onManageExtras: () => void;
}) => {
  return (
    <Card className={`${!item.active ? 'opacity-60' : ''}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">
            {item.name}
            {!item.active && <span className="ml-2 text-xs font-normal py-1 px-2 bg-red-100 text-red-800 rounded-full">Inativo</span>}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={onManageExtras}>
              <PlusCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 text-xs mt-2 w-fit">
          <Tag className="h-3 w-3" />
          {item.product_categories?.name || "Categoria desconhecida"}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {item.image_url && (
          <div className="w-full h-32 mb-3 overflow-hidden rounded-md">
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150?text=Imagem+não+disponível';
              }}
            />
          </div>
        )}
        <p className="text-sm text-gray-600 line-clamp-2 h-10">{item.description || "Sem descrição"}</p>
        <div className="flex justify-between items-center mt-4">
          <p className="text-lg font-bold">R$ {item.price.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ExtraItemCard = ({ 
  item, 
  onEdit, 
  onDelete,
  categories = []
}: { 
  item: ProductExtra; 
  onEdit: () => void; 
  onDelete: () => void;
  categories: ProductCategory[];
}) => {
  const category = categories.find(cat => cat.id === item.category_id);
  
  return (
    <Card className={`${!item.active ? 'opacity-60' : ''}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">
            {item.name}
            {!item.active && <span className="ml-2 text-xs font-normal py-1 px-2 bg-red-100 text-red-800 rounded-full">Inativo</span>}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {category && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs mt-2 w-fit">
            <Tag className="h-3 w-3" />
            {category.name}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-gray-600">{item.description || "Sem descrição"}</p>
        <div className="flex justify-between items-center mt-4">
          <p className="text-lg font-bold flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
            R$ {item.price.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuPage;

