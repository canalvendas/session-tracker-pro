import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, RefreshCw, Users, UserCheck, UserX, Ban, Shield, Building, UserCog, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  is_paid: boolean;
  created_at: string;
  roles: string[];
  manager_id: string | null;
  manager_name?: string | null;
}

interface Manager {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  professionals_count: number;
}

export function AdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userToBlock, setUserToBlock] = useState<UserProfile | null>(null);
  const [userToManageRole, setUserToManageRole] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userToAssignManager, setUserToAssignManager] = useState<UserProfile | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=pending`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pending users');
      }

      const result = await response.json();
      setPendingUsers(result.users || []);
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      if (error.message?.includes('Forbidden')) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão de administrador.",
          variant: "destructive",
        });
        navigate('/');
      }
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=all`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch all users');
      }

      const result = await response.json();
      setAllUsers(result.users || []);
    } catch (error: any) {
      console.error('Error fetching all users:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=managers`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setManagers(result.managers || []);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchPendingUsers(), fetchAllUsers(), fetchManagers()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const approveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      toast({
        title: "Acesso liberado!",
        description: "O usuário agora pode acessar o app.",
      });

      await refreshData();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível liberar o acesso.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const revokeUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=revoke`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to revoke user');
      }

      toast({
        title: "Acesso bloqueado",
        description: "O usuário não pode mais acessar o app.",
      });

      await refreshData();
    } catch (error) {
      console.error('Error revoking user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível bloquear o acesso.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setUserToBlock(null);
    }
  };

  const setUserRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=set-role`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, role }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to set role');
      }

      toast({
        title: "Role atualizado!",
        description: `O usuário agora é ${role === 'manager' ? 'Gestor' : role === 'professional' ? 'Profissional' : role}.`,
      });

      await refreshData();
    } catch (error) {
      console.error('Error setting role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o role.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setUserToManageRole(null);
      setSelectedRole('');
    }
  };

  const assignManager = async (userId: string, managerId: string | null) => {
    setActionLoading(userId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=assign-manager`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, managerId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign manager');
      }

      toast({
        title: managerId ? "Gestor vinculado!" : "Vínculo removido!",
        description: managerId ? "O profissional foi vinculado ao gestor." : "O profissional foi desvinculado do gestor.",
      });

      await refreshData();
    } catch (error) {
      console.error('Error assigning manager:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o vínculo.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setUserToAssignManager(null);
      setSelectedManagerId('');
    }
  };

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('admin')) return <Badge variant="destructive">Admin</Badge>;
    if (roles.includes('manager')) return <Badge className="bg-blue-600 hover:bg-blue-700">Gestor</Badge>;
    if (roles.includes('professional')) return <Badge variant="secondary">Profissional</Badge>;
    return <Badge variant="outline">Usuário</Badge>;
  };

  const UserCard = ({ user, showActions = true }: { user: UserProfile; showActions?: boolean }) => (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-foreground truncate">
                {user.full_name || 'Sem nome'}
              </p>
              {getRoleBadge(user.roles)}
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastro: {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            {user.manager_name && (
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <Building className="h-3 w-3" />
                Gestor: {user.manager_name}
              </p>
            )}
          </div>
          {showActions && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={user.is_paid ? "default" : "secondary"}>
                  {user.is_paid ? "Ativo" : "Pendente"}
                </Badge>
              </div>
              <TooltipProvider>
                <div className="flex gap-1">
                  {/* Aprovar */}
                  {!user.is_paid && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => approveUser(user.user_id)}
                          disabled={actionLoading === user.user_id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === user.user_id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Liberar acesso</p></TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Definir Role */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUserToManageRole(user);
                          setSelectedRole(user.roles[0] || '');
                        }}
                        disabled={actionLoading === user.user_id || user.roles.includes('admin')}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Definir Role</p></TooltipContent>
                  </Tooltip>

                  {/* Vincular Gestor */}
                  {!user.roles.includes('admin') && !user.roles.includes('manager') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setUserToAssignManager(user);
                            setSelectedManagerId('');
                          }}
                          disabled={actionLoading === user.user_id}
                        >
                          {user.manager_id ? <Unlink className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{user.manager_id ? 'Alterar/Remover Gestor' : 'Vincular a Gestor'}</p></TooltipContent>
                    </Tooltip>
                  )}

                  {/* Bloquear */}
                  {user.is_paid && !user.roles.includes('admin') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setUserToBlock(user)}
                          disabled={actionLoading === user.user_id}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Bloquear acesso</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ManagerCard = ({ manager }: { manager: Manager }) => (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/20">
              <Building className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">{manager.full_name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">{manager.email}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {manager.professionals_count} profissional{manager.professionals_count !== 1 ? 'is' : ''}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen gradient-surface pb-24">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
            </div>
            <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-500/20">
                <UserX className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{pendingUsers.length}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-500/20">
                <UserCheck className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {allUsers.filter(u => u.is_paid).length}
                </p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Building className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{managers.length}</p>
                <p className="text-xs text-muted-foreground">Gestores</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              <UserX className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Pendentes</span> ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Usuários</span> ({allUsers.length})
            </TabsTrigger>
            <TabsTrigger value="managers" className="text-xs sm:text-sm">
              <Building className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Gestores</span> ({managers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-8 text-center">
                  <UserCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum usuário pendente!</p>
                </CardContent>
              </Card>
            ) : (
              pendingUsers.map(user => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : allUsers.length === 0 ? (
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum usuário cadastrado.</p>
                </CardContent>
              </Card>
            ) : (
              allUsers.map(user => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent value="managers" className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : managers.length === 0 ? (
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-8 text-center">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum gestor cadastrado.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Defina o role "Gestor" para um usuário na aba Usuários.
                  </p>
                </CardContent>
              </Card>
            ) : (
              managers.map(manager => (
                <ManagerCard key={manager.id} manager={manager} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de confirmação para bloquear usuário */}
      <AlertDialog open={!!userToBlock} onOpenChange={(open) => !open && setUserToBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja bloquear o acesso de{" "}
              <span className="font-semibold text-foreground">
                {userToBlock?.full_name || userToBlock?.email}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToBlock && revokeUser(userToBlock.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Ban className="h-4 w-4 mr-2" />
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para definir role */}
      <Dialog open={!!userToManageRole} onOpenChange={(open) => !open && setUserToManageRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Role</DialogTitle>
            <DialogDescription>
              Escolha o papel de {userToManageRole?.full_name || userToManageRole?.email}
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Profissional</SelectItem>
              <SelectItem value="manager">Gestor</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToManageRole(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => userToManageRole && selectedRole && setUserRole(userToManageRole.user_id, selectedRole)}
              disabled={!selectedRole || actionLoading === userToManageRole?.user_id}
            >
              {actionLoading === userToManageRole?.user_id ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para vincular gestor */}
      <Dialog open={!!userToAssignManager} onOpenChange={(open) => !open && setUserToAssignManager(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular a Gestor</DialogTitle>
            <DialogDescription>
              Escolha o gestor para {userToAssignManager?.full_name || userToAssignManager?.email}
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um gestor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem gestor (remover vínculo)</SelectItem>
              {managers.map(manager => (
                <SelectItem key={manager.user_id} value={manager.user_id}>
                  {manager.full_name || manager.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToAssignManager(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => userToAssignManager && assignManager(
                userToAssignManager.user_id, 
                selectedManagerId === 'none' ? null : selectedManagerId || null
              )}
              disabled={actionLoading === userToAssignManager?.user_id}
            >
              {actionLoading === userToAssignManager?.user_id ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
