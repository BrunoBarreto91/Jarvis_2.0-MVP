import { parseNaturalLanguage } from "./server/_core/taskParser";

async function testParser() {
  console.log("🧪 Testando Parser de Linguagem Natural\n");

  const testCases = [
    "Criar post para Instagram sobre nova coleção, prazo amanhã, prioridade alta",
    "Cadastrar 10 produtos no Mercado Livre até sexta-feira",
    "Fazer 3 reels para TikTok Shop sobre promoção de verão",
    "Atualizar políticas de devolução no Shopee",
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testando: "${testCase}"`);
    console.log("─".repeat(80));

    try {
      const result = await parseNaturalLanguage(testCase);

      if (result.success) {
        console.log("✅ Sucesso!");
        console.log("\nPreview:");
        console.log(result.preview);
        console.log("\nDados estruturados:");
        console.log(JSON.stringify(result.task, null, 2));
      } else {
        console.log("❌ Falha!");
        console.log("Preview:", result.preview);
        console.log("Campos faltando:", result.missingFields);
        console.log("Valores sugeridos:", result.suggestedValues);
      }
    } catch (error) {
      console.error("💥 Erro:", error);
    }
  }

  console.log("\n\n✨ Testes concluídos!");
}

testParser().catch(console.error);
