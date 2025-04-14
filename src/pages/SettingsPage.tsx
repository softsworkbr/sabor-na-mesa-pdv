import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { updateRestaurant } from "@/utils/restaurant";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPrinterConfigsByRestaurant } from "@/utils/restaurant";
import { PrinterConfigModal } from "@/components/modals/PrinterConfigModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SettingsPage = () => {
  const { currentRestaurant, refreshRestaurants } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<any>(null);

  const { data: printers = [], refetch } = useQuery({
    queryKey: ['printers', currentRestaurant?.id],
    queryFn: () => getPrinterConfigsByRestaurant(currentRestaurant?.id || ''),
    enabled: !!currentRestaurant?.id,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: currentRestaurant?.name || '',
      address: currentRestaurant?.address || '',
      phone: currentRestaurant?.phone || '',
    }
  });

  const onSubmit = async (data: any) => {
    try {
      if (!currentRestaurant?.id) {
        toast({
          title: "Erro",
          description: "Selecione um restaurante para editar.",
          variant: "destructive",
        });
        return;
      }

      await updateRestaurant(currentRestaurant.id, data);
      await refreshRestaurants();
      
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações.",
        variant: "destructive",
      });
    }
  };

  const handleAddPrinter = () => {
    setSelectedPrinter(null);
    setIsModalOpen(true);
  };

  const handleEditPrinter = (printer: any) => {
    setSelectedPrinter(printer);
    setIsModalOpen(true);
  };

  if (!currentRestaurant) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione um restaurante para configurar.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do seu restaurante
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="printers">Impressoras</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Restaurante</CardTitle>
              <CardDescription>
                Atualize as informações básicas do seu restaurante.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Restaurante</Label>
                  <Input
                    id="name"
                    placeholder="Nome do restaurante"
                    {...register("name", { required: "Nome é obrigatório" })}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    placeholder="Endereço"
                    {...register("address")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="Telefone"
                    {...register("phone")}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="printers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Impressoras</CardTitle>
                  <CardDescription>
                    Gerencie suas impressoras térmicas
                  </CardDescription>
                </div>
                <Button onClick={handleAddPrinter}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Impressora
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome de Exibição</TableHead>
                    <TableHead>Nome da Impressora no Windows</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Endereço IP</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printers.map((printer) => (
                    <TableRow key={printer.id}>
                      <TableCell>{printer.display_name}</TableCell>
                      <TableCell>{printer.windows_printer_name}</TableCell>
                      <TableCell>{printer.endpoint || '-'}</TableCell>
                      <TableCell>{printer.ip_address || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPrinter(printer)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {printers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        Nenhuma impressora configurada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do seu sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Opções de personalização em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure suas preferências de notificação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Opções de notificação em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PrinterConfigModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
        restaurantId={currentRestaurant?.id || ''}
        existingConfig={selectedPrinter}
      />
    </div>
  );
};

export default SettingsPage;
