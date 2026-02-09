import os
import json
from openai import OpenAI

# O Manus já pré-configura o cliente OpenAI com a API Key e Base URL corretas
client = OpenAI()

SYSTEM_PROMPT = """You are Jarvis 2.0, an intelligent Exocortex assistant for Cognitive Management.
Your job is to interpret natural language task descriptions and extract structured information.

**Valid Enums:**
- frente: "trabalho", "pessoal", "saude", "estudo"
- tipo: "foco_profundo", "manutencao_vital", "rotina", "urgente"
- prioridade: "baixa", "media", "alta"
- esforco: "baixo", "medio", "alto"

**Parsing Rules:**
1. Always extract a clear, concise title (max 255 chars)
2. Infer frente from context:
   - Instagram-related → "reativacao_ig"
   - Mercado Livre, Shopee, TikTok Shop → "canais_venda"
3. Infer canal from keywords (Instagram, ML, Shopee, TikTok Shop)
4. Infer tipo from task description keywords
5. Parse prazo (deadline) from relative dates like "today", "tomorrow", "next week", "D1", "D2", etc.
   - Return ISO 8601 date format (YYYY-MM-DD)
   - If no date specified, return null
6. Default prioridade to "media" if not specified
7. Default esforco to "medio" if not specified
8. Extract bloqueador (blocker) if mentioned (e.g., "waiting for supplier response")
9. Extract notas (notes) if additional context is provided

**Response Format:**
Return a JSON object with this structure:
{
  "success": true,
  "task": {
    "title": "string",
    "frente": "reativacao_ig" | "canais_venda",
    "canal": "instagram" | "mercado_livre" | "shopee" | "tiktok_shop",
    "tipo": "conteudo" | "cadastro_listing" | "politicas" | "logistica" | "criativos_ugc" | "ads",
    "prazo": "YYYY-MM-DD" | null,
    "prioridade": "baixa" | "media" | "alta",
    "esforco": "baixo" | "medio" | "alto",
    "bloqueador": "string" | null,
    "notas": "string" | null
  }
}
"""

def test_input(user_input):
    print(f"\n📝 Testando: \"{user_input}\"")
    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Parse this task description: \"{user_input}\""}
            ],
            response_format={"type": "json_object"}
        )
        print("🤖 Resposta da IA:")
        print(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_input("Postar manifesto de reativação no IG hoje à tarde, prioridade alta, preciso falar com o designer antes")
    test_input("Preciso organizar as fotos do estoque hoje")
    test_input("Encaixar entre a tarefa A e B para você não empacar nela a tarde toda")
