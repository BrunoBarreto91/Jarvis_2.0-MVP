const { getPool } = require('/opt/nodejs/database');

exports.handler = async (event) => {
    try {
        const pool = await getPool();
        const userId = event.requestContext.authorizer.jwt.claims.sub;

        // Esperamos o ID da tarefa e o novo status no corpo do PATCH
        const { id, status } = JSON.parse(event.body);

        // Segurança Stark: Só atualiza se a tarefa pertencer ao usuário logado
        const [result] = await pool.query(
            "UPDATE tasks SET status = ? WHERE id = ? AND userId = ?",
            [status || 'completed', id, userId]
        );

        if (result.affectedRows === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Tarefa nao encontrada ou acesso negado." })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Sistemas atualizados, Mr. Stark!", taskId: id }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Falha na atualizacao!", error: error.message }),
        };
    }
};