import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserWithRole, getUsersForRestaurant, addUserToRestaurant, removeUserFromRestaurant, updateUserRole } from '@/utils/restaurant';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  UserPlus, 
  UserX, 
  UserCog, 
  Loader2,
  Mail,
  User as UserIcon,
  ShieldCheck,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface AddUserFormData {
  email: string;
  role: 'manager' | 'staff';
}

const addUserSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['manager', 'staff'], { required_error: 'Selecione uma função' })
});

const UsersPage = () => {
  const { currentRestaurant } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: '',
      role: 'staff'
    }
  });

  const loadUsers = async () => {
    if (!currentRestaurant) return;
    
    setIsLoading(true);
    try {
      const data = await getUsersForRestaurant(currentRestaurant.id);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Falha ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentRestaurant]);

  const handleAddUser = async (data: AddUserFormData) => {
    if (!currentRestaurant) return;
    
    setIsSubmitting(true);
    try {
      const success = await addUserToRestaurant(
        currentRestaurant.id,
        data.email,
        data.role
      );
      
      if (success) {
        form.reset();
        setIsDialogOpen(false);
        loadUsers();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveUser = async (userId: string) => {
    if (!currentRestaurant) return;
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    
    try {
      const success = await removeUserFromRestaurant(
        currentRestaurant.id,
        userId
      );
      
      if (success) {
        loadUsers();
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };
  
  const handleUpdateRole = async (userId: string, role: 'manager' | 'staff') => {
    if (!currentRestaurant) return;
    
    try {
      const success = await updateUserRole(
        currentRestaurant.id,
        userId,
        role
      );
      
      if (success) {
        loadUsers();
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const isOwner = (role: string) => role === 'owner';

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        
        {currentRestaurant?.role !== 'staff' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus size={16} />
                <span>Adicionar Usuário</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar novo usuário</DialogTitle>
                <DialogDescription>
                  Adicione um usuário existente ao restaurante {currentRestaurant?.name}.
                  O usuário já deve ter uma conta no sistema.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="usuario@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="staff">Funcionário</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Adicionar
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                {currentRestaurant?.role === 'owner' && (
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(user.full_name || user.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || user.username || 'Usuário'}</p>
                          {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email || 'Sem email'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4 w-4 ${
                          user.role === 'owner' ? 'text-red-500' : 
                          user.role === 'manager' ? 'text-amber-500' : 
                          'text-green-500'
                        }`} />
                        <span className="capitalize">{
                          user.role === 'owner' ? 'Proprietário' : 
                          user.role === 'manager' ? 'Gerente' : 
                          'Funcionário'
                        }</span>
                      </div>
                    </TableCell>
                    {currentRestaurant?.role === 'owner' && (
                      <TableCell className="text-right">
                        {!isOwner(user.role) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {user.role !== 'manager' && (
                                <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'manager')}>
                                  <UserCog className="mr-2 h-4 w-4" />
                                  <span>Promover a Gerente</span>
                                </DropdownMenuItem>
                              )}
                              {user.role !== 'staff' && (
                                <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'staff')}>
                                  <UserIcon className="mr-2 h-4 w-4" />
                                  <span>Alterar para Funcionário</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveUser(user.id)}
                                className="text-red-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Remover do Restaurante</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
