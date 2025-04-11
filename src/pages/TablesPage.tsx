
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search,
  ShoppingCart,
  Printer,
  ArrowLeft,
  MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import TableOrderDrawer from "@/components/TableOrderDrawer";

type TableStatus = "free" | "occupied" | "active" | "reserved";

interface TableItem {
  id: number;
  number: number;
  status: TableStatus;
  occupants?: number;
  timeElapsed?: string;
  orderItems?: number;
  description?: string; // Added description field for displaying additional info
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const getTables = (): TableItem[] => {
  // Generate sample data for tables
  return Array.from({ length: 42 }, (_, i) => {
    const statuses: TableStatus[] = ["free", "occupied", "active", "reserved"];
    const status = statuses[Math.floor(Math.random() * 4)] as TableStatus;
    
    // Add some descriptions for active tables
    let description = "";
    if (status === "active") {
      const descriptions = [
        "marcos gatos",
        "eduardo palmeiras",
        "ana maria",
        "couple",
        "família",
        "daniela",
        "marcos",
        "guilhermes",
        "lais",
        "goiaba"
      ];
      description = descriptions[Math.floor(Math.random() * descriptions.length)];
    }
    
    return {
      id: i + 1,
      number: i + 1,
      status,
      occupants: status !== "free" ? Math.floor(Math.random() * 6) + 1 : undefined,
      timeElapsed: status !== "free" ? `${Math.floor(Math.random() * 120) + 10}m` : undefined,
      orderItems: status !== "free" ? Math.floor(Math.random() * 10) + 1 : undefined,
      description: status === "active" ? description : undefined
    };
  });
};

const statusColors: Record<TableStatus, string> = {
  free: "bg-gray-400",
  occupied: "bg-amber-500",
  active: "bg-green-600",
  reserved: "bg-blue-500"
};

const statusLabels: Record<TableStatus, string> = {
  free: "Livre",
  occupied: "Ocupada",
  active: "Em Atendimento",
  reserved: "Reservada"
};

const TablesPage = () => {
  const [tables, setTables] = useState<TableItem[]>(getTables());
  const [selectedStatus, setSelectedStatus] = useState<TableStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);

  const filteredTables = tables.filter(table => 
    (selectedStatus === "all" || table.status === selectedStatus) &&
    (searchQuery === "" || table.number.toString().includes(searchQuery) || 
     (table.description && table.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const statusCounts = tables.reduce((acc, table) => {
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleTableClick = (table: TableItem) => {
    setSelectedTable(table);
    setIsOrderDrawerOpen(true);
  };

  const handleNewTable = () => {
    // Create a new table with default values
    const newTable: TableItem = {
      id: tables.length + 1,
      number: tables.length + 1,
      status: "free"
    };
    setSelectedTable(newTable);
    setIsOrderDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsOrderDrawerOpen(false);
    setSelectedTable(null);
  };

  // Group tables by status for better visualization
  const activeTablesCount = statusCounts.active || 0;
  const freeTablesCount = statusCounts.free || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mesas</h1>
          <p className="text-muted-foreground">
            Gerenciamento de mesas do restaurante.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button className="bg-pos-primary hover:bg-pos-primary/90" onClick={handleNewTable}>
            <Plus className="h-4 w-4 mr-2" /> Nova Mesa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-100">
          <CardContent className="p-4">
            <div className="text-sm font-medium">Total de Mesas</div>
            <div className="text-2xl font-bold mt-1">{tables.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="text-sm font-medium">Mesas Livres</div>
            <div className="text-2xl font-bold mt-1">{statusCounts.free || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4">
            <div className="text-sm font-medium">Mesas Ocupadas</div>
            <div className="text-2xl font-bold mt-1">{(statusCounts.occupied || 0) + (statusCounts.active || 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="text-sm font-medium">Reservas</div>
            <div className="text-2xl font-bold mt-1">{statusCounts.reserved || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Buscar mesa por número ou descrição..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant={selectedStatus === "all" ? "default" : "outline"}
          onClick={() => setSelectedStatus("all")}
        >
          Todas
        </Button>
        <Button 
          variant={selectedStatus === "free" ? "default" : "outline"}
          onClick={() => setSelectedStatus("free")}
          className={selectedStatus === "free" ? "" : "text-gray-700"}
        >
          Livres
        </Button>
        <Button 
          variant={selectedStatus === "occupied" ? "default" : "outline"}
          onClick={() => setSelectedStatus("occupied")}
          className={selectedStatus === "occupied" ? "" : "text-amber-700"}
        >
          Ocupadas
        </Button>
        <Button 
          variant={selectedStatus === "active" ? "default" : "outline"}
          onClick={() => setSelectedStatus("active")}
          className={selectedStatus === "active" ? "" : "text-green-700"}
        >
          Em Atendimento
        </Button>
        <Button 
          variant={selectedStatus === "reserved" ? "default" : "outline"}
          onClick={() => setSelectedStatus("reserved")}
          className={selectedStatus === "reserved" ? "" : "text-blue-700"}
        >
          Reservadas
        </Button>
      </div>

      {/* Active tables section similar to the image */}
      {activeTablesCount > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Pedidos em Andamento ({activeTablesCount} de {tables.length})</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {tables
              .filter(table => table.status === "active")
              .map((table) => (
                <div 
                  key={table.id} 
                  className="bg-green-600 text-white rounded-md p-2 aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-green-700 transition-colors"
                  onClick={() => handleTableClick(table)}
                >
                  <div className="text-xl font-bold">{table.number.toString().padStart(2, '0')}</div>
                  <div className="text-xs">{table.description}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Free tables section */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-3">Mesas Livres</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {tables
            .filter(table => table.status === "free")
            .map((table) => (
              <div 
                key={table.id} 
                className="bg-gray-400 text-white rounded-md p-2 aspect-square flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
                onClick={() => handleTableClick(table)}
              >
                <div className="text-xl font-bold">{table.number.toString().padStart(2, '0')}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Other tables - grid view of all remaining tables */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-3">Outras Mesas</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {tables
            .filter(table => table.status !== "free" && table.status !== "active")
            .map((table) => (
              <div 
                key={table.id} 
                className={`${statusColors[table.status]} text-white rounded-md p-2 aspect-square flex items-center justify-center cursor-pointer hover:opacity-90 transition-colors`}
                onClick={() => handleTableClick(table)}
              >
                <div className="text-xl font-bold">{table.number.toString().padStart(2, '0')}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Table Order Drawer */}
      <TableOrderDrawer 
        isOpen={isOrderDrawerOpen} 
        onClose={handleCloseDrawer} 
        table={selectedTable} 
      />
    </div>
  );
};

export default TablesPage;
