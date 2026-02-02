const { getPool } = require('/opt/nodejs/database');

exports.handler = async (event) => {
    try {
        const pool = await getPool();
        const userId = event.requestContext.authorizer.jwt.claims.sub;

        const [rows] = await pool.query(
            "SELECT * FROM tasks WHERE userId = ? ORDER BY created_at DESC",
            [userId]
        );

        return { statusCode: 200, body: JSON.stringify({ tasks: rows }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};