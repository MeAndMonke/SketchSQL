import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../db/db.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();
router.post('/api/createConnection', async (req, res) => {
    const { connection } = req.body;
    try {
        const connectionDB = await pool.getConnection();
        const [result] = await connectionDB.query('INSERT INTO Connections (startID, endID, relation, controlDotX, controlDotY) VALUES (?, ?, ?, ?, ?)', [connection.startID, connection.endID, connection.relation || '1:1', Number.isFinite(connection.controlDotX) ? connection.controlDotX : 0, Number.isFinite(connection.controlDotY) ? connection.controlDotY : 0]);
        connectionDB.release();
        res.json({ message: 'Connection created', connectionId: result.insertId });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
router.get('/api/getConnections', async (req, res) => {
    const rowId = req.query.rowId;
    try {
        const connectionDB = await pool.getConnection();
        const [rows] = await connectionDB.query(`SELECT * FROM Connections WHERE startID = ?`, [rowId]);
        connectionDB.release();
        res.json({ connections: rows });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
router.post('/api/deleteConnection', async (req, res) => {
    const { connectionId } = req.body;
    try {
        const connectionDB = await pool.getConnection();
        await connectionDB.query('DELETE FROM Connections WHERE id = ?', [connectionId]);
        connectionDB.release();
        res.json({ message: 'Connection deleted successfully' });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
export default router;
//# sourceMappingURL=connections.js.map