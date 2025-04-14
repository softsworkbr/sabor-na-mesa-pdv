import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import TableOrderDrawer from "@/components/TableOrderDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { TableItem, TableStatus, createTable, getTablesByRestaurant, updateTable, TableOrderTable } from "@/utils/restaurant";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const statusColors: Record<TableStatus, string> = {
  free: "bg-gray-400",
  occupied: "bg-amber-500",
  active: "bg-green-600",
  reserved: "bg-blue-500",
  blocked: "bg-red-600"
};

const statusLabels: Record<TableStatus, string> = {
  free: "Livre",
  occupied: "Ocupada",
  active: "Em Atendimento",
  reserved: "Reservada",
  blocked: "Bloqueada"
};

const TablesPage = () => {
  const { currentRestaurant } = useAuth();
  const { toast } = useToast();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<TableStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableStatus, setNewTableStatus] = useState<TableStatus>("free");
  const [newTableOccupants, setNewTableOccupants] = useState("");
  const [newTableDescription, setNewTableDescription] = useState("");

  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchTables();
    } else {
      setTables([]);
      setLoading(false);
    }
  }, [currentRestaurant?.id]);

  const fetchTables = async () => {
    if (!currentRestaurant?.id) return;
    
    setLoading(true);
    try {
      const data = await getTablesByRestaurant(currentRestaurant.id);
      setTables(data);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar as mesas. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!currentRestaurant?.id) {
      toast({
        title: "Erro",
        description: "Selecione um restaurante primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!newTableNumber || isNaN(parseInt(newTableNumber))) {
      toast({
        title: "Erro",
        description: "Número da mesa inválido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tableData = {
        number: parseInt(newTableNumber),
        status: newTableStatus,
        restaurant_id: currentRestaurant.id,
        occupants: newTableOccupants ? parseInt(newTableOccupants) : null,
        description: newTableDescription || null
      };

      await createTable(tableData);
      fetchTables();
      setIsCreateDialogOpen(false);
      resetNewTableForm();
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  const resetNewTableForm = () => {
    setNewTableNumber("");
    setNewTableStatus("free");
    setNewTableOccupants("");
    setNewTableDescription("");
  };

  const filteredTables = tables.filter(table => 
    (selectedStatus === "all" || table.status === selectedStatus) &&
    (searchQuery === "" || 
     table.number.toString().includes(searchQuery) || 
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

  const handleCloseDrawer = () => {
    setIsOrderDrawerOpen(false);
    setSelectedTable(null);
    fetchTables();
  };

  const activeTablesCount = statusCounts.active || 0;
  const freeTablesCount = statusCounts.free || 0;
  const blockedTablesCount = statusCounts.blocked || 0;

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <h2 className="text-2xl font-semibold text-gray-600">Selecione um restaurante</h2>
        <p className="text-gray-500">Você precisa selecionar um restaurante para visualizar as mesas.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mesas</h1>
          <p className="text-muted-foreground">
            Gerenciamento de mesas do restaurante {currentRestaurant?.name}.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTables}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden md:inline">Atualizar</span>
          </Button>
          <Button 
            className="bg-pos-primary hover:bg-pos-primary/90" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
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
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <div className="text-sm font-medium">Mesas Bloqueadas</div>
            <div className="text-2xl font-bold mt-1">{blockedTablesCount || 0}</div>
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
        <Button 
          variant={selectedStatus === "blocked" ? "default" : "outline"}
          onClick={() => setSelectedStatus("blocked")}
          className={selectedStatus === "blocked" ? "" : "text-red-700"}
        >
          Bloqueadas
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {activeTablesCount > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Pedidos em Andamento ({activeTablesCount} de {tables.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {tables
                  .filter(table => table.status === "active")
                  .map((table) => (
                    <div 
                      key={table.id} 
                      className="bg-green-600 text-white rounded-md p-2 aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-green-700 transition-colors"
                      onClick={() => handleTableClick(table)}
                    >
                      <div className="text-xl font-bold">{table.number.toString().padStart(2, '0')}</div>
                      <div className="text-xs truncate max-w-full">{table.description}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {freeTablesCount > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-3">Mesas Livres</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
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
          )}

          {tables.some(table => table.status !== "free" && table.status !== "active") && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-3">Outras Mesas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
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
          )}

          {tables.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <div className="text-gray-400 text-lg">Nenhuma mesa cadastrada</div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Mesa
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Mesa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number" className="text-right">
                Número
              </Label>
              <Input
                id="number"
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={newTableStatus}
                onValueChange={(value) => setNewTableStatus(value as TableStatus)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Livre</SelectItem>
                  <SelectItem value="occupied">Ocupada</SelectItem>
                  <SelectItem value="active">Em Atendimento</SelectItem>
                  <SelectItem value="reserved">Reservada</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="occupants" className="text-right">
                Ocupantes
              </Label>
              <Input
                id="occupants"
                type="number"
                value={newTableOccupants}
                onChange={(e) => setNewTableOccupants(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Input
                id="description"
                value={newTableDescription}
                onChange={(e) => setNewTableDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTable}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TableOrderDrawer 
        isOpen={isOrderDrawerOpen} 
        onClose={handleCloseDrawer} 
        table={selectedTable ? {
          id: selectedTable.id.toString(),
          number: selectedTable.number,
          status: selectedTable.status,
          capacity: selectedTable.occupants || 0
        } as TableOrderTable : null} 
      />
    </div>
  );
};

export default TablesPage;
