import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../db/db.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();
router.get('/api/getRows', async (req, res) => {
    const canvasId = req.query.canvasId;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM RowEnteries WHERE nodeID = ?', [canvasId]);
        connection.release();
        res.json({ rows: rows });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
router.post('/api/saveRow', async (req, res) => {
    const { row } = req.body;
    try {
        const connection = await pool.getConnection();
        await connection.query(`UPDATE RowEnteries
            SET rowIndex = ?,
            name = ?,
            type = ?,
            comment = ?,
            defaultValue = ?,
            indexType = ?,
            nullable = ?,
            autoIncrement = ?,
            isUnsigned = ?
            WHERE id = ?`, [row.rowIndex, row.name, row.type, row.comment, row.defaultValue, row.indexType, row.nullable, row.autoIncrement, row.isUnsigned, row.id]);
        connection.release();
        res.json({ message: 'Rows saved successfully' });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
export default router;
//# sourceMappingURL=rows.js.map