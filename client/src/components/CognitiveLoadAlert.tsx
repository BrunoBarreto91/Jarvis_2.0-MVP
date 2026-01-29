import { Task } from "../../../drizzle/schema";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CognitiveLoadAlertProps {
  tasks: Task[];
  threshold?: number;
}

// No Jarvis 2.0, o tempo é a unidade de medida para combater o Time Blindness
const EFFORT_MINUTES = {
  baixo: 30,  // Tarefas rápidas
  medio: 90,  // Foco moderado
  alto: 240,  // Hyperfocus potencial (4h+)
};

const STRESS_POINTS = {
  alta: 3,
  media: 1,
  baixa: 0,
};

export function CognitiveLoadAlert({ tasks, threshold = 10 }: CognitiveLoadAlertProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.prazo || task.status === "done") return acc;

    const dateKey = format(new Date(task.prazo), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Calculate cognitive load for each date
  const overloadedDates = Object.entries(tasksByDate)
    .map(([dateKey, dateTasks]) => {
      const totalMinutes = dateTasks.reduce((sum, task) => sum + EFFORT_MINUTES[task.esforco as keyof typeof EFFORT_MINUTES], 0);
      const totalStress = dateTasks.reduce((sum, task) => sum + STRESS_POINTS[task.prioridade as keyof typeof STRESS_POINTS], 0);
      
      // A carga é uma combinação de tempo e estresse mental
      const load = (totalMinutes / 60) + totalStress;

      return {
        dateKey,
        date: new Date(dateKey),
        tasks: dateTasks,
        load,
        isOverloaded: load > threshold,
      };
    })
    .filter((item) => item.isOverloaded && !dismissed.has(item.dateKey))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (overloadedDates.length === 0) return null;

  return (
    <div className="space-y-3">
      {overloadedDates.map((item) => (
        <Alert
          key={item.dateKey}
          className="bg-warning/20 border-warning/50 relative"
        >
          <AlertTriangle className="h-5 w-5 text-warning-foreground" />
          <AlertTitle className="text-warning-foreground font-semibold">
            ⚠️ Atenção: Risco de Sobrecarga Cognitiva
          </AlertTitle>
          <AlertDescription className="text-warning-foreground space-y-2">
            <p>
              O Jarvis detectou <strong>{Math.round(item.load)} unidades de carga</strong> para{" "}
              <strong>{format(item.date, "dd/MM/yyyy (EEEE)", { locale: ptBR })}</strong>.
            </p>
            <p className="text-sm">
              Isso equivale a aproximadamente <strong>{Math.floor(item.tasks.reduce((s, t) => s + EFFORT_MINUTES[t.esforco as keyof typeof EFFORT_MINUTES], 0) / 60)} horas</strong> de foco intenso. 
              Cuidado com o <em>hyperfocus</em> em detalhes irrelevantes.
            </p>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="bg-background/50 hover:bg-background"
                onClick={() => {
                  // TODO: Implement redistribution suggestions
                  alert("Funcionalidade de redistribuição em desenvolvimento");
                }}
              >
                Ver Sugestões de Redistribuição
              </Button>
              <Button
                size="sm"
                variant="ghost"
              onClick={() => {
                setDismissed((prev) => new Set([...Array.from(prev), item.dateKey]));
              }}
              >
                <X className="w-4 h-4 mr-1" />
                Ignorar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
