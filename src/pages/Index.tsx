import React from "react";
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import RestaurantList from "@/components/RestaurantList";

const DashboardStat = ({ title, value, icon, trend }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  trend?: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="w-8 h-8 bg-pos-primary/10 rounded-md flex items-center justify-center text-pos-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span>{trend} em relação à ontem</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const Index = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const { currentRestaurant } = useAuth();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!currentRestaurant) {
    return (
      <div className="p-6">
        <RestaurantList />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu restaurante.
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Clock className="h-5 w-5 text-pos-primary" />
          <span className="font-medium">
            {currentTime.toLocaleTimeString()} - {currentTime.toLocaleDateString()}
          </span>
          <Button className="ml-4 bg-pos-primary hover:bg-pos-primary/90">
            Novo Pedido
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStat
          title="Total de Pedidos"
          value="127"
          icon={<ShoppingBag className="h-5 w-5" />}
          trend="12% ↑"
        />
        <DashboardStat
          title="Vendas Hoje"
          value="R$ 3.642,50"
          icon={<DollarSign className="h-5 w-5" />}
          trend="8% ↑"
        />
        <DashboardStat
          title="Clientes Hoje"
          value="42"
          icon={<Users className="h-5 w-5" />}
          trend="5% ↑"
        />
        <DashboardStat
          title="Ticket Médio"
          value="R$ 86,72"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Pedidos em Andamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div>
                <p className="font-medium">#1254 - Mesa 12</p>
                <p className="text-sm text-muted-foreground">4 itens • 15 minutos</p>
              </div>
              <Button variant="outline" className="border-amber-500 text-amber-700">Em Preparo</Button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div>
                <p className="font-medium">#1253 - Mesa 08</p>
                <p className="text-sm text-muted-foreground">2 itens • 5 minutos</p>
              </div>
              <Button variant="outline" className="border-blue-500 text-blue-700">Servindo</Button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-md">
              <div>
                <p className="font-medium">#1252 - Mesa 16</p>
                <p className="text-sm text-muted-foreground">6 itens • 25 minutos</p>
              </div>
              <Button variant="outline" className="border-green-500 text-green-700">Concluído</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Status das Mesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 25 }).map((_, i) => {
                const status = Math.random() > 0.6 ? "active" : Math.random() > 0.3 ? "occupied" : "free";
                return (
                  <div 
                    key={i} 
                    className={`
                      aspect-square rounded flex items-center justify-center font-bold text-white
                      ${status === "active" ? "bg-pos-active" : 
                        status === "occupied" ? "bg-amber-500" : "bg-gray-400"}
                    `}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
