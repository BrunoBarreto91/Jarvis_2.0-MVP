import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { jarvisApi } from "../lib/services/jarvis"; // Importando nossa ponte nova
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Task } from "../../../drizzle/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  task?: Task;
}

export function TaskModal({ open, onOpenChange, onSuccess, task }: TaskModalProps) {
  const [mode, setMode] = useState<"natural" | "manual">("natural");
  const [naturalInput, setNaturalInput] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Novo estado de loading para o Jarvis

  // Manual form state
  const [formData, setFormData] = useState({
    title: task?.title || "",
    frente: (task as any)?.contexto || "reativacao_ig", // Ajustado para bater com o banco
    canal: (task as any)?.tag || "instagram",
    tipo: (task as any)?.categoria || "conteudo",
    prazo: task?.prazo ? new Date(task.prazo).toISOString().split("T")[0] : "",
    prioridade: task?.prioridade || "media",
    esforco: task?.esforco || "medio",
    bloqueador: task?.bloqueador || "",
    notas: task?.notas || "",
  });

  // Legado (tRPC) - Mantemos o update e parseNatural por enquanto
  const parseNatural = trpc.tasks.parseNatural.useMutation();
  const updateTask = trpc.tasks.update.useMutation();

  const handleParseNatural = async () => {
    if (!naturalInput.trim()) {
      toast.error("Digite uma descrição da tarefa");
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseNatural.mutateAsync({ input: naturalInput });
      if (result.success && result.task) {
        setPreview(result);
        toast.success("Tarefa interpretada com sucesso!");
      } else {
        toast.error(result.preview || "Não foi possível interpretar a tarefa");
      }
    } catch (error: any) {
      toast.error(`Erro ao interpretar: ${error?.message || "Erro desconhecido"}`);
    } finally {
      setIsParsing(false);
    }
  };

  // NOVA LÓGICA: Criar via Jarvis (n8n)
  const handleCreateFromPreview = async () => {
    if (!preview?.task) return;

    setIsSaving(true);
    try {
      await jarvisApi.createTask({
        ...preview.task,
        contexto: preview.task.frente,
        tag: preview.task.canal,
        categoria: preview.task.tipo,
        userId: 1 // Temporário até termos auth
      });
      toast.success("Jarvis criou a tarefa!");
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error("Erro ao falar com o Jarvis");
    } finally {
      setIsSaving(false);
    }
  };

  // NOVA LÓGICA: Manual Submit via Jarvis
  const handleManualSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      if (task) {
        // PATCH ainda via tRPC por enquanto, até chegarmos lá
        await updateTask.mutateAsync({
          id: task.id,
          ...formData,
          prazo: formData.prazo ? new Date(formData.prazo) : undefined,
        } as any);
        toast.success("Tarefa atualizada!");
      } else {
        // CRIAÇÃO via Jarvis (n8n)
        await jarvisApi.createTask({
          title: formData.title,
          contexto: formData.frente,
          tag: formData.canal,
          categoria: formData.tipo,
          prioridade: formData.prioridade as any,
          esforco: formData.esforco as any,
          notas: formData.notas,
          bloqueador: formData.bloqueador,
          prazo: formData.prazo ? new Date(formData.prazo).toISOString() : undefined,
          userId: 1
        });
        toast.success("Jarvis registrou a nova tarefa!");
      }
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error("Erro na operação");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNaturalInput("");
    setPreview(null);
    setMode("natural");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          <DialogDescription>
            {mode === "natural"
              ? "Descreva a tarefa em linguagem natural e deixe a IA interpretar"
              : "Preencha os campos manualmente"}
          </DialogDescription>
        </DialogHeader>

        {!task && (
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={mode === "natural" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("natural")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Linguagem Natural
            </Button>
            <Button
              variant={mode === "manual" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("manual")}
            >
              Manual
            </Button>
          </div>
        )}

        {mode === "natural" && !preview && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descreva a tarefa</Label>
              <Textarea
                placeholder='Ex: "Post fixado manifesto no IG para hoje alta"'
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleParseNatural}
              disabled={isParsing || !naturalInput.trim()}
              className="w-full"
            >
              {isParsing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Interpretando...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Interpretar com IA</>
              )}
            </Button>
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            <Alert className="bg-primary/10 border-primary/30">
              <Check className="w-4 h-4 text-primary" />
              <AlertDescription className="whitespace-pre-line text-sm">
                {preview.preview}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={handleCreateFromPreview} disabled={isSaving} className="flex-1">
                {isSaving ? <Loader2 className="animate-spin" /> : "Confirmar e Criar"}
              </Button>
              <Button variant="outline" onClick={() => setPreview(null)}>Cancelar</Button>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frente">Frente</Label>
                <Select value={formData.frente} onValueChange={(v) => setFormData({ ...formData, frente: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reativacao_ig">Reativação IG</SelectItem>
                    <SelectItem value="canais_venda">Canais de Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="canal">Canal</Label>
                <Select value={formData.canal} onValueChange={(v) => setFormData({ ...formData, canal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="mercado_livre">Mercado Livre</SelectItem>
                    <SelectItem value="shopee">Shopee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(v) => setFormData({ ...formData, prioridade: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo</Label>
                <Input type="date" value={formData.prazo} onChange={(e) => setFormData({ ...formData, prazo: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} rows={3} />
            </div>

            <Button onClick={handleManualSubmit} disabled={isSaving || updateTask.isPending} className="w-full">
              {isSaving ? <Loader2 className="animate-spin" /> : task ? "Atualizar" : "Criar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}