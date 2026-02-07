const mysql = require('mysql2/promise');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({ region: "us-east-1" });
let pool;

async function getPool() {
    if (pool) return pool;

    try {
        const command = new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN });
        const secretResponse = await client.send(command);
        const creds = JSON.parse(secretResponse.SecretString);

        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: creds.username,
            password: creds.password,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 5,
            connectTimeout: 5000 // Limite de 5s para nao travar a Lambda
        });

        return pool;
    } catch (error) {
        console.error("ERRO DE CONEXAO JARVIS:", error);
        throw error;
    }
}

module.exports = { getPool };