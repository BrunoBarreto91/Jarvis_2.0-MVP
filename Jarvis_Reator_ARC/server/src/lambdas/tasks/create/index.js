const { getPool } = require('/opt/nodejs/database'); // Sua Layer
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const lambdaClient = new LambdaClient({ region: "us-east-1" });

exports.handler = async (event) => {
    console.log("🚀 Jarvis Executivo: Iniciando processo de análise e registro.");

    try {
        const pool = await getPool();

        // 1. Extração de Identidade e Dados (JWT do Cognito)
        const userId = event.requestContext.authorizer.jwt.claims.sub;
        const { title, description } = JSON.parse(event.body);

        if (!title) {
            return { statusCode: 400, body: JSON.stringify({ error: "O título é obrigatório." }) };
        }

        // 2. Consultar o Cérebro (Python + Claude 3.5)
        console.log("🧠 Solicitando análise TDAH ao Jarvis Brain...");
        const jarvisAnalysis = await getJarvisAnalysis(title, description);

        // 3. Salvar no MySQL (Incluindo os dados da IA)
        const query = `
            INSERT INTO tasks (
                userId, title, description,
                estimated_minutes, original_estimate, buffer_minutes,
                complexity, steps, mood_alert, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            userId,
            title,
            description,
            jarvisAnalysis.estimated_minutes,
            jarvisAnalysis.original_estimate,
            jarvisAnalysis.buffer_minutes,
            jarvisAnalysis.complexity,
            JSON.stringify(jarvisAnalysis.steps),
            jarvisAnalysis.mood_alert,
            'pending'
        ];

        const [result] = await pool.query(query, values);

        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                message: "Tarefa analisada e registrada com sucesso!",
                taskId: result.insertId,
                analysis: jarvisAnalysis
            })
        };

    } catch (error) {
        console.error("❌ Erro no Executivo:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erro interno", details: error.message })
        };
    }
};

// Função para invocar a Lambda Brain
async function getJarvisAnalysis(title, description) {
    const payload = { title, description };

    const command = new InvokeCommand({
        FunctionName: "jarvis-brain",
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({ body: JSON.stringify(payload) }),
    });

    try {
        const response = await lambdaClient.send(command);
        const result = JSON.parse(Buffer.from(response.Payload).toString());

        // O body da resposta do Python vem como string
        const brainBody = JSON.parse(result.body);

        if (result.statusCode !== 200) throw new Error("Falha na IA");

        return brainBody.data;

    } catch (err) {
        console.warn("⚠️ IA Offline. Usando modo de contingência.");
        return {
            estimated_minutes: 30,
            original_estimate: 30,
            buffer_minutes: 0,
            complexity: "N/A",
            steps: ["Processar manualmente"],
            mood_alert: "Conexão com o cérebro instável. Salvei o básico."
        };
    }
}