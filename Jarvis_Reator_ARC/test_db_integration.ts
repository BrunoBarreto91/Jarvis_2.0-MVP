import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log('--- TESTE DE CONEXÃO E INSERÇÃO JARVIS 2.0 ---');
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('❌ Erro: DATABASE_URL não encontrada no .env');
        return;
    }

    const connection = await createConnection(url);
    try {
        console.log('✅ Conexão estabelecida com sucesso!');

        // Teste de inserção
        const [result] = await connection.execute(
            'INSERT INTO tasks (userId, title, frente, tipo, prioridade, esforco, criadoEm, atualizadoEm) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [1, 'Teste de Integração Jarvis 2.0', 'trabalho', 'rotina', 'media', 'baixo']
        );

        console.log('✅ Inserção de tarefa de teste bem-sucedida! ID:', (result as any).insertId);

        // Seleção de limpeza
        const [rows] = await connection.execute('SELECT * FROM tasks WHERE title = ?', ['Teste de Integração Jarvis 2.0']);
        console.log('✅ Verificação de dados:', JSON.stringify(rows));

    } catch (err) {
        console.error('❌ Erro durante o teste:', err);
    } finally {
        await connection.end();
        console.log('--- FIM DO TESTE ---');
    }
}

testConnection();
