
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  Clock,
  Filter,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface OrderItem {
  id: string;
  tableNumber: number;
  customerName: string;
  items: number;
  total: string;
  status: "pending" | "preparing" | "ready" | "delivered" | "paid";
  time: string;
}

const getOrders = (): OrderItem[] => {
  const statuses: ("pending" | "preparing" | "ready" | "delivered" | "paid")[] = [
    "pending", "preparing", "ready", "delivered", "paid"
  ];
  
  return Array.from({ length: 20 }, (_, i) => {
    const id = (1000 + i).toString();
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id,
      tableNumber: Math.floor(Math.random() * 30) + 1,
      customerName: ["João", "Maria", "Pedro", "Ana", "Carlos", "Luisa"][Math.floor(Math.random() * 6)],
      items: Math.floor(Math.random() * 10) + 1,
      total: `R$ ${(Math.random() * 200 + 50).toFixed(2)}`,
      status,
      time: `${Math.floor(Math.random() * 50) + 5}m`,
    };
  });
};

const statusColors = {
  pending: "bg-yellow-500",
  preparing: "bg-amber-500",
  ready: "bg-green-500",
  delivered: "bg-blue-500",
  paid: "bg-gray-500",
};

const statusLabels = {
  pending: "Pendente",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
  paid: "Pago",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<OrderItem[]>(getOrders());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.includes(searchQuery) || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie os pedidos do seu restaurante.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button className="bg-pos-primary hover:bg-pos-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Novo Pedido
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por número ou cliente..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Button 
            variant="outline" 
            className="flex items-center gap-1 whitespace-nowrap"
            onClick={() => setSelectedStatus(null)}
          >
            <Filter className="h-4 w-4" />
            Todos
          </Button>
          {Object.entries(statusLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedStatus === key ? "default" : "outline"}
              className={`whitespace-nowrap ${!selectedStatus || selectedStatus !== key ? "bg-white" : ""}`}
              onClick={() => setSelectedStatus(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className={`h-1 ${statusColors[order.status]}`} />
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <span className="text-lg font-bold">{order.tableNumber}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Pedido #{order.id}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Cliente: {order.customerName}</span>
                        <span>•</span>
                        <span>{order.items} itens</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{order.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="text-right md:text-left flex-1 md:flex-none">
                      <p className="font-bold">{order.total}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        statusColors[order.status].replace('bg', 'bg-opacity-20 text')
                      }`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <Button variant="outline" className="hidden md:flex">Detalhes</Button>
                    <Button variant="outline" className="hidden md:flex">Atualizar</Button>
                    <Button className="bg-pos-primary hover:bg-pos-primary/90 flex-1 md:flex-none">
                      {order.status === "pending" ? "Preparar" :
                       order.status === "preparing" ? "Pronto" :
                       order.status === "ready" ? "Entregar" :
                       order.status === "delivered" ? "Finalizar" : "Ver Detalhes"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
