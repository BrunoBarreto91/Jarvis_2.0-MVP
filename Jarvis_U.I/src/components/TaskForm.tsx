import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * TaskForm Component - Jarvis 2.0 Ingestion Layer
 * Logic: Captures raw intent and dispatches to n8n for AI processing.
 */
export function TaskForm() {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch("https://bruno-spock.app.n8n.cloud/webhook/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
            description,
            sessionId: "bruno_session_01",
            }),
      });

      if (response.ok) {
          const data = await response.text();  // .text() – evita JSON fail
          alert(data.message || 'Tarefa registrada com Jarvis!');  // Visual simples
          console.log("Raw response:", data);
          setDescription("");
      } else {
        throw new Error(`Erro: ${response.status}`);
      }
    } catch (error) {
      console.error("Communication failure with n8n workflow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-sm border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-slate-700">
          O que está na sua mente agora?
        </CardTitle>
      </CardHeader> {/* CORREÇÃO: Fechamento correto do componente Shadcn */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Ex: Preciso revisar o orçamento da AWS amanhã cedo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] text-base resize-none focus-visible:ring-1 focus-visible:ring-slate-400"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !description.trim()}
              className="bg-slate-900 text-white hover:bg-slate-800 px-8"
            >
              {isLoading ? "Enviando..." : "Registrar com Jarvis"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}