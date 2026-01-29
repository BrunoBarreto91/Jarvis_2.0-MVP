import { trpc } from "@/lib/trpc";
import { TaskCard } from "@/components/TaskCard";
import { Loader2, Construction, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Bloqueadores() {
  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery({ status: "blocked" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const blockedTasks = tasks?.filter(t => t.status === "blocked") || [];

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Construction className="w-8 h-8 text-destructive" />
          Radar de Bloqueadores
        </h1>
        <p className="text-muted-foreground">
          Estas tarefas estão impedindo o seu fluxo. O Jarvis recomenda resolver estas pendências antes de iniciar novos ciclos de hyperfocus.
        </p>
      </div>

      {blockedTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blockedTasks.map((task) => (
            <div key={task.id} className="relative group">
              <div className="absolute -top-2 -right-2 z-10 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                BLOQUEADO
              </div>
              <TaskCard 
                task={task} 
                onClick={() => {}} // TODO: Abrir modal de edição
              />
              {task.bloqueador && (
                <Alert className="mt-2 bg-destructive/5 border-destructive/20">
                  <Info className="h-4 w-4 text-destructive" />
                  <AlertTitle className="text-xs font-semibold text-destructive">Motivo do Bloqueio:</AlertTitle>
                  <AlertDescription className="text-xs italic">
                    "{task.bloqueador}"
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border-2 border-dashed">
          <Construction className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-xl font-medium text-muted-foreground">Caminho livre! Nenhum bloqueador detectado.</p>
          <p className="text-sm text-muted-foreground">Sua carga cognitiva agradece.</p>
        </div>
      )}
    </div>
  );
}
