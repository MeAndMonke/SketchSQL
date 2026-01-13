import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/db.js';
import { connect } from 'http2';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();
router.get('/api/createProject', async (req, res) => {
    const userId = req.session.user.id;
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO canvas (ownerID) VALUES (?)', [userId]);
        connection.release();
        res.json({ message: 'Project created', projectId: result.insertId });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
router.get('/api/getProjects', async (req, res) => {
    const userId = req.session.user.id;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM canvas WHERE ownerID = ?', [userId]);
        console.log(rows);
        connection.release();
        res.json({ projects: rows });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
export default router;
//# sourceMappingURL=projects.js.map