
import { ENV } from "./server/_core/env";

async function invokeLLM(params: any) {
  const payload = {
    model: "gemini-2.5-flash",
    messages: params.messages,
    response_format: params.response_format,
    max_tokens: 32768,
    thinking: { budget_tokens: 128 }
  };

  const response = await fetch("https://forge.manus.im/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

const SYSTEM_PROMPT = `You are Jarvis 2.0, an intelligent Exocortex assistant for Cognitive Management.
Your job is to interpret natural language task descriptions and extract structured information.

**Valid Enums:**
- frente: "trabalho", "pessoal", "saude", "estudo"
- tipo: "foco_profundo", "manutencao_vital", "rotina", "urgente"
- prioridade: "baixa", "media", "alta"
- esforco: "baixo", "medio", "alto"

**Parsing Rules:**
1. Always extract a clear, concise title (max 255 chars)
2. Infer frente from context: trabalho, pessoal, saude, estudo
3. Infer tipo from task description keywords
4. Parse prazo (deadline) from relative dates like "today", "tomorrow", "next week", "D1", "D2", etc.
   - Return ISO 8601 date format (YYYY-MM-DD)
   - If no date specified, return null
5. Default prioridade to "media" if not specified
6. Default esforco to "medio" if not specified
7. Extract bloqueador (blocker) if mentioned
8. Extract local (context/place) if mentioned
9. Extract notas (notes) if additional context is provided`;

async function testInput(input: string) {
  console.log(`\n📝 Testando: "${input}"`);

  const response = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Parse this task description: "${input}"` }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  console.log("🤖 Resposta da IA:");
  console.log(content);
}

async function run() {
  await testInput("Preciso terminar o relatório de infra amanhã cedo, foco profundo, prioridade alta");
  await testInput("Comprar remédio e marcar consulta no cardiologista");
  await testInput("Estudar padrões de projeto no fim de semana");
}

run();
