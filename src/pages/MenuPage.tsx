
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertTriangle
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

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
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

type CategoryFormValues = z.infer<typeof categorySchema>;

const categories = [
  { id: "main", name: "Principais", icon: UtensilsCrossed },
  { id: "appetizers", name: "Entradas", icon: Salad },
  { id: "burgers", name: "Hamburgers", icon: Utensils },
  { id: "pizzas", name: "Pizzas", icon: Pizza },
  { id: "desserts", name: "Sobremesas", icon: IceCream },
  { id: "drinks", name: "Bebidas", icon: Coffee },
  { id: "alcohol", name: "Álcool", icon: Wine },
];

const generateMenuItems = (): MenuItem[] => {
  const items: MenuItem[] = [
    // Main dishes
    { id: "1", name: "Feijoada Completa", description: "Feijoada tradicional com arroz, farofa e couve.", price: 45.90, category: "main" },
    { id: "2", name: "Picanha na Brasa", description: "Picanha grelhada com arroz, feijão e vinagrete.", price: 59.90, category: "main" },
    { id: "3", name: "Parmegiana de Frango", description: "Filé de frango empanado coberto com molho de tomate e queijo.", price: 39.90, category: "main" },
    { id: "4", name: "Filé à Parmegiana", description: "Filé mignon empanado com molho de tomate e queijo gratinado.", price: 55.90, category: "main" },
    { id: "5", name: "Risoto de Camarão", description: "Risoto cremoso com camarões frescos.", price: 62.90, category: "main" },
    
    // Appetizers
    { id: "6", name: "Bolinho de Bacalhau", description: "Porção com 12 unidades.", price: 32.90, category: "appetizers" },
    { id: "7", name: "Isca de Peixe", description: "Isca de tilápia empanada com molho tártaro.", price: 28.90, category: "appetizers" },
    { id: "8", name: "Coxinha de Frango", description: "Porção com 10 unidades.", price: 24.90, category: "appetizers" },
    
    // Burgers
    { id: "9", name: "Hambúrguer Clássico", description: "Pão, hambúrguer, queijo, alface, tomate e maionese.", price: 29.90, category: "burgers" },
    { id: "10", name: "Cheese Bacon", description: "Pão, hambúrguer, queijo, bacon, alface, tomate e maionese.", price: 34.90, category: "burgers" },
    { id: "11", name: "Hambúrguer Duplo", description: "Pão, 2 hambúrgueres, queijo cheddar, bacon, cebola crispy e molho especial.", price: 39.90, category: "burgers" },
    
    // Pizzas
    { id: "12", name: "Pizza Margherita", description: "Molho de tomate, mussarela, tomate e manjericão.", price: 45.90, category: "pizzas" },
    { id: "13", name: "Pizza Calabresa", description: "Molho de tomate, mussarela e calabresa fatiada.", price: 49.90, category: "pizzas" },
    { id: "14", name: "Pizza Quatro Queijos", description: "Molho de tomate, mussarela, provolone, gorgonzola e parmesão.", price: 52.90, category: "pizzas" },
    
    // Desserts
    { id: "15", name: "Pudim de Leite", description: "Pudim de leite condensado tradicional.", price: 12.90, category: "desserts" },
    { id: "16", name: "Petit Gateau", description: "Bolo de chocolate com centro cremoso acompanhado de sorvete de creme.", price: 19.90, category: "desserts" },
    { id: "17", name: "Sorvete", description: "Duas bolas de sorvete com calda de chocolate.", price: 10.90, category: "desserts" },
    
    // Drinks
    { id: "18", name: "Refrigerante", description: "Lata 350ml.", price: 6.90, category: "drinks" },
    { id: "19", name: "Suco Natural", description: "Copo 300ml. Laranja, abacaxi, limão ou maracujá.", price: 8.90, category: "drinks" },
    { id: "20", name: "Água Mineral", description: "Garrafa 500ml com ou sem gás.", price: 4.90, category: "drinks" },
    
    // Alcohol
    { id: "21", name: "Cerveja", description: "Garrafa 600ml.", price: 12.90, category: "alcohol" },
    { id: "22", name: "Caipirinha", description: "Cachaça, limão, açúcar e gelo.", price: 18.90, category: "alcohol" },
    { id: "23", name: "Vinho Tinto", description: "Taça 150ml.", price: 22.90, category: "alcohol" },
  ];
  
  return items;
};

const MenuPage = () => {
  const { currentRestaurant } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(generateMenuItems());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("main");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [showCategoriesTab, setShowCategoriesTab] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      has_extras: false,
      active: true,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (currentRestaurant) {
      fetchProductCategories();
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

  const openCategoryDialog = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      form.reset({
        name: category.name,
        description: category.description || "",
        has_extras: category.has_extras,
        active: category.active,
        sort_order: category.sort_order,
      });
    } else {
      setEditingCategory(null);
      form.reset({
        name: "",
        description: "",
        has_extras: false,
        active: true,
        sort_order: productCategories.length,
      });
    }
    setShowCategoryDialog(true);
  };

  const closeCategoryDialog = () => {
    setShowCategoryDialog(false);
    setEditingCategory(null);
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

  const confirmDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryToDelete);
      
      if (error) throw error;
      
      toast.success("Categoria excluída com sucesso!");
      await fetchProductCategories();
    } catch (error: any) {
      toast.error(`Erro ao excluir categoria: ${error.message}`);
      console.error('Error deleting product category:', error);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const filteredItems = menuItems.filter(item => 
    (activeCategory === "all" || item.category === activeCategory) &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
            onClick={() => showCategoriesTab ? openCategoryDialog() : null}
          >
            <Plus className="h-4 w-4 mr-2" /> 
            {showCategoriesTab ? "Nova Categoria" : "Novo Item"}
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
              placeholder="Buscar itens..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="main" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-4 flex overflow-x-auto pb-px">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="p-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map(item => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>
            
            {categories.map(category => (
              <TabsContent key={category.id} value={category.id} className="p-0">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map(item => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSaveCategory)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                    control={form.control}
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
                control={form.control}
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
                control={form.control}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory}
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

const MenuItemCard = ({ item }: { item: MenuItem }) => {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-600 line-clamp-2 h-10">{item.description}</p>
        <div className="flex justify-between items-center mt-4">
          <p className="text-lg font-bold">R$ {item.price.toFixed(2)}</p>
          <Button variant="outline" className="h-8">Adicionar ao Pedido</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuPage;
