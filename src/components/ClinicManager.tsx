import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Pencil, Trash2, Star, Clock, Stethoscope } from "lucide-react";
import { Clinic, ClinicFormData } from "@/types/clinic";
import { ClinicForm } from "./ClinicForm";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";

interface ClinicManagerProps {
  clinics: Clinic[];
  onAdd: (data: ClinicFormData) => Promise<Clinic | null>;
  onUpdate: (id: string, data: ClinicFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ClinicManager({ clinics, onAdd, onUpdate, onDelete }: ClinicManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [deleteClinic, setDeleteClinic] = useState<Clinic | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleAdd = async (data: ClinicFormData) => {
    const result = await onAdd(data);
    if (result) {
      toast({
        title: "Clínica adicionada!",
        description: `${data.name} foi criada com sucesso`,
      });
    }
  };

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setFormOpen(true);
  };

  const handleUpdate = async (data: ClinicFormData) => {
    if (!editingClinic) return;
    await onUpdate(editingClinic.id, data);
    setEditingClinic(null);
    toast({
      title: "Clínica atualizada!",
      description: `${data.name} foi atualizada com sucesso`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteClinic) return;
    await onDelete(deleteClinic.id);
    toast({
      title: "Clínica excluída",
      description: `${deleteClinic.name} foi removida`,
    });
    setDeleteClinic(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingClinic(null);
  };

  return (
    <Card variant="elevated">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">
            Clínicas / Locais
          </h2>
          <p className="text-xs text-muted-foreground">
            Gerencie seus locais de trabalho
          </p>
        </div>
      </div>

      {/* Clinic List */}
      <div className="space-y-2 mb-4">
        {clinics.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma clínica cadastrada</p>
            <p className="text-xs mt-1">Adicione sua primeira clínica abaixo</p>
          </div>
        ) : (
          clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: clinic.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground truncate">
                    {clinic.name}
                  </span>
                  {clinic.is_default && (
                    <Star className="h-3 w-3 text-amber-500 shrink-0" fill="currentColor" />
                  )}
                  <Badge variant={clinic.payment_type === 'shift' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                    {clinic.payment_type === 'shift' ? (
                      <><Clock className="h-2.5 w-2.5 mr-0.5" /> Turno</>
                    ) : (
                      <><Stethoscope className="h-2.5 w-2.5 mr-0.5" /> Sessão</>
                    )}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {clinic.payment_type === 'shift' 
                    ? `${formatCurrency(clinic.shift_value)}/turno`
                    : `${formatCurrency(clinic.session_value)}/sessão`
                  }
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(clinic)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteClinic(clinic)}
                  disabled={clinics.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setEditingClinic(null);
          setFormOpen(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Clínica
      </Button>

      {/* Form Dialog */}
      <ClinicForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSave={editingClinic ? handleUpdate : handleAdd}
        clinic={editingClinic}
        isOnlyClinic={clinics.length === 0}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClinic} onOpenChange={() => setDeleteClinic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir clínica?</AlertDialogTitle>
            <AlertDialogDescription>
              As sessões já registradas nesta clínica serão mantidas, mas ficarão sem vínculo.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
