import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Comando: Buscar tarefas do Supabase
  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Erro ao carregar Jarvis:", error);
    else setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Jarvis - Secretário Inteligente (Sandbox)</h1>
      
      {loading ? (
        <p>Acessando banco de dados...</p>
      ) : (
        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <p>Nenhuma tarefa encontrada. Pronto para iniciar.</p>
          ) : (
            tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{task.description}</p>
                  <span className="text-xs font-mono">Prioridade: {task.priority}</span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}