
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
  Tag
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
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByRestaurant,
  getProductsByCategory,
  CreateProductProps,
  UpdateProductProps
} from "@/utils/restaurant/restaurantManagement";

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

type CategoryFormValues = z.infer<typeof categorySchema>;
type ProductFormValues = z.infer<typeof productSchema>;

const MenuPage = () => {
  const { currentRestaurant } = useAuth();
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [showCategoriesTab, setShowCategoriesTab] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (currentRestaurant) {
      fetchProductCategories();
      fetchProducts();
    }
  }, [currentRestaurant]);

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

  useEffect(() => {
    if (currentRestaurant) {
      if (activeCategory === 'all') {
        fetchProducts();
      } else {
        fetchProductsByCategory(activeCategory);
      }
    }
  }, [activeCategory, currentRestaurant]);

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

  const closeCategoryDialog = () => {
    setShowCategoryDialog(false);
    setEditingCategory(null);
  };

  const closeProductDialog = () => {
    setShowProductDialog(false);
    setEditingProduct(null);
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

  const confirmDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = (productId: string) => {
    setProductToDelete(productId);
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
      }
    } catch (error: any) {
      toast.error(`Erro ao excluir: ${error.message}`);
      console.error('Error deleting:', error);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const filteredProducts = products.filter(item => 
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
          <Button 
            className="bg-pos-primary hover:bg-pos-primary/90"
            onClick={() => showCategoriesTab 
              ? openCategoryDialog() 
              : openProductDialog()
            }
          >
            <Plus className="h-4 w-4 mr-2" /> 
            {showCategoriesTab ? "Nova Categoria" : "Novo Produto"}
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
              placeholder="Buscar produtos..." 
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
                      />
                    ))
                  )}
                </div>
              )}
            </TabsContent>
            
            {productCategories.filter(cat => cat.active).map(category => (
              <TabsContent key={category.id} value={category.id} className="p-0">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-pos-primary" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.length === 0 ? (
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
                        />
                      ))
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
                : "Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCategoryToDelete(null);
              setProductToDelete(null);
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
  onDelete 
}: { 
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
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

export default MenuPage;
