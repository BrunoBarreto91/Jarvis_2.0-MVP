// O Node.js busca automaticamente no diretório do Layer (/opt/)
const { getPool } = require('/opt/nodejs/database');

exports.handler = async (event) => {
    try {
        console.log("Iniciando verificação de sistemas...");

        // Tenta buscar o pool (isso testará Secrets Manager + KMS + RDS)
        const pool = await getPool();

        // Executa uma query simples de teste
        const [rows] = await pool.query('SELECT 1 + 1 AS connection_test');

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Jarvis: Sistemas operacionais e blindados!",
                security: "Conexão via Secrets Manager estabelecida",
                database_test: rows[0].connection_test === 2 ? "Sucesso" : "Falha"
            }),
        };
    } catch (error) {
        console.error("ERRO CRÍTICO NO SISTEMA:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                status: "Offline",
                error: error.message,
                hint: "Verifique as permissões de KMS ou o ARN do segredo no CloudWatch"
            }),
        };
    }
};