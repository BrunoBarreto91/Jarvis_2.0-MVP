import { parseNaturalLanguage } from "./server/_core/taskParser";

async function runTest() {
  console.log("🚀 Iniciando Teste do Cérebro do Jarvis...");
  
  const inputs = [
    "Postar manifesto de reativação no IG hoje à tarde, prioridade alta, preciso falar com o designer antes",
    "Preciso organizar as fotos do estoque hoje",
    "Configurar conta Shopee amanhã média logística"
  ];

  for (const input of inputs) {
    console.log(`\n📝 Input: "${input}"`);
    try {
      const result = await parseNaturalLanguage(input);
      if (result.success) {
        console.log("✅ Sucesso!");
        console.log(result.preview);
      } else {
        console.log("❌ Falha na interpretação:");
        console.log(result.preview);
      }
    } catch (error) {
      console.error("💥 Erro crítico no teste:", error);
    }
  }
}

runTest();
