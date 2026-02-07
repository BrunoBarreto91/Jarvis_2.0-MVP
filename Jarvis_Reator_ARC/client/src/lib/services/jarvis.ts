// client/src/lib//services/jarvis.ts

const N8N_POST_URL = import.meta.env.VITE_N8N_WEBHOOK_POST_URL;

export interface NewTaskPayload {
  title: string;
  contexto?: string;
  prioridade?: 'alta' | 'media' | 'baixa';
  nivel_energia?: 'alta' | 'media' | 'baixa';
  notas?: string;
  // Adicione outros campos se seu formulário enviar
}

export const jarvisApi = {
  createTask: async (task: NewTaskPayload) => {
    if (!N8N_POST_URL) {
      console.error("URL do Jarvis não configurada!");
      throw new Error("Configuração ausente: VITE_N8N_WEBHOOK_POST_URL");
    }

    const response = await fetch(N8N_POST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`Erro no Jarvis: ${response.statusText}`);
    }

    return await response.json();
  }
};