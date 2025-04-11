import React from "react";
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
  Utensils
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

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
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>(generateMenuItems());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("main");
  
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
        <div className="mt-4 md:mt-0">
          <Button className="bg-pos-primary hover:bg-pos-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Novo Item
          </Button>
        </div>
      </div>
      
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
