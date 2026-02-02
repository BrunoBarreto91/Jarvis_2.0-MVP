const { getPool } = require('/opt/nodejs/database');

exports.handler = async (event) => {
    // 1. Verificação de chave administrativa
    const adminKey = event.queryStringParameters?.key;
    if (adminKey !== process.env.ADMIN_SETUP_KEY) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: "Acesso negado: Chave Stark invalida." })
        };
    }

    try {
        const pool = await getPool();

        // 2. Garante que a tabela base exista
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                INDEX(userId)
            )
        `);

        // 3. Sincronização de colunas (Incluindo as novas colunas da IA)
        const columns = [
            { name: "description",        spec: "TEXT AFTER title" },
            { name: "status",             spec: "ENUM('pending', 'completed') DEFAULT 'pending' AFTER description" },
            { name: "created_at",         spec: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status" },
            { name: "estimated_minutes",  spec: "INT AFTER description" },
            { name: "original_estimate",  spec: "INT AFTER estimated_minutes" },
            { name: "buffer_minutes",     spec: "INT AFTER original_estimate" },
            { name: "complexity",         spec: "VARCHAR(50) AFTER buffer_minutes" },
            { name: "steps",              spec: "JSON AFTER complexity" },
            { name: "mood_alert",         spec: "TEXT AFTER steps" }
        ];

        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE tasks ADD COLUMN ${col.name} ${col.spec}`);
                console.log(`Coluna ${col.name} sincronizada.`);
            } catch (err) {
                // ER_DUP_FIELDNAME (1060): A coluna já existe, podemos ignorar
                if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
                    continue;
                } else {
                    throw err;
                }
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Bunker Jarvis: Sincronizacao de colunas completa!",
                status: "Pronto para receber dados da IA."
            })
        };

    } catch (error) {
        console.error("Erro critico no Setup:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};