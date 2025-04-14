
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  Clock,
  Filter,
  Eye,
  ChevronDown,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  getOrders,
  updateOrder,
  Order,
  OrderStatus
} from "@/utils/restaurant";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const statusColors = {
  active: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  pending: "bg-blue-500",
};

const statusLabels = {
  active: "Em Andamento",
  completed: "Finalizado",
  cancelled: "Cancelado",
  pending: "Pendente",
};

const getTimeElapsed = (dateString: string) => {
  const orderDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - orderDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins}m`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }
};

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  const { 
    data: orders, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['orders', selectedStatus],
    queryFn: () => getOrders(selectedStatus || undefined),
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchesSearch;
  }) || [];

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      toast.success(`Pedido atualizado para ${statusLabels[newStatus]}`);
      refetch();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Erro ao atualizar status do pedido");
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): { label: string, value: OrderStatus } => {
    switch (currentStatus) {
      case "pending":
        return { label: "Iniciar", value: "active" };
      case "active":
        return { label: "Finalizar", value: "completed" };
      case "completed":
        return { label: "Ver Detalhes", value: "completed" };
      case "cancelled":
        return { label: "Ver Detalhes", value: "cancelled" };
      default:
        return { label: "Atualizar", value: "active" };
    }
  };

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
            variant={selectedStatus === null ? "default" : "outline"} 
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
              className={`whitespace-nowrap ${selectedStatus !== key ? "bg-white" : ""}`}
              onClick={() => setSelectedStatus(key as OrderStatus)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <p className="text-red-500">Erro ao carregar pedidos.</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
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
                      <span className="text-lg font-bold">{order.table_id.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Pedido #{order.id?.substring(0, 6)}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                        <span>Cliente: {order.customer_name || "Não informado"}</span>
                        <span>•</span>
                        <span>{order.items?.length || 0} itens</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{order.created_at ? getTimeElapsed(order.created_at) : "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="text-right md:text-left flex-1 md:flex-none">
                      <p className="font-bold">R$ {order.total_amount?.toFixed(2).replace('.', ',') || '0,00'}</p>
                      <Badge className={`bg-opacity-20 ${statusColors[order.status].replace('bg', 'bg-opacity-20 text')}`}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" className="hidden md:flex">
                        <Eye className="h-4 w-4 mr-2" /> Detalhes
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="hidden md:flex">
                            Ações <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {order.status !== "completed" && order.status !== "cancelled" && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id!, "completed")}>
                              Finalizar Pedido
                            </DropdownMenuItem>
                          )}
                          {order.status !== "cancelled" && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id!, "cancelled")}>
                              Cancelar Pedido
                            </DropdownMenuItem>
                          )}
                          {order.status === "pending" && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id!, "active")}>
                              Iniciar Pedido
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button className="bg-pos-primary hover:bg-pos-primary/90">
                        {getNextStatus(order.status).label}
                      </Button>
                    </div>
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
