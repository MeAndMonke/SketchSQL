import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/db.js';
import { connect } from 'http2';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();
router.post('/api/createProject', async (req, res) => {
    const userId = req.session.user.id;
    const title = req.body.title;
    const description = req.body.description;
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO Canvas (ownerID, title, description) VALUES (?, ?, ?)', [userId, title, description]);
        connection.release();
        res.status(201).json({ message: 'Project created', projectId: result.insertId });
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
        const [rows] = await connection.query('SELECT * FROM Canvas WHERE ownerID = ?', [userId]);
        connection.release();
        res.json({ projects: rows });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
router.post('/api/deleteProject', async (req, res) => {
    const { projectId } = req.body;
    try {
        const ownerId = req.session.user.id;
        // Verify project ownership
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT ownerID FROM Canvas WHERE id = ?', [projectId]);
        if (rows.length === 0 || rows[0].ownerID !== ownerId) {
            connection.release();
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await connection.query('DELETE FROM Canvas WHERE id = ?', [projectId]);
        connection.release();
        res.json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
export default router;
//# sourceMappingURL=projects.js.map