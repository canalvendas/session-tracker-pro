import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, RefreshCw, Users, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  is_paid: boolean;
  created_at: string;
}

export function AdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchPendingUsers(), fetchAllUsers()]);
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
        title: "Acesso revogado",
        description: "O usuário não pode mais acessar o app.",
      });

      await refreshData();
    } catch (error) {
      console.error('Error revoking user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível revogar o acesso.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const UserCard = ({ user, showApprove = true }: { user: UserProfile; showApprove?: boolean }) => (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {user.full_name || 'Sem nome'}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastro: {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.is_paid ? "default" : "secondary"}>
              {user.is_paid ? "Ativo" : "Pendente"}
            </Badge>
            {showApprove && !user.is_paid && (
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
            )}
            {user.is_paid && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => revokeUser(user.user_id)}
                disabled={actionLoading === user.user_id}
              >
                {actionLoading === user.user_id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/20">
                <UserX className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingUsers.length}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {allUsers.filter(u => u.is_paid).length}
                </p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Pendentes ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Todos ({allUsers.length})
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
                <UserCard key={user.id} user={user} showApprove={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
