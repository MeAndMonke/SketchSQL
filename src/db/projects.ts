import { Router } from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/db.js';
import { connect } from 'http2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/api/createProject', async (req:Request, res: Response) => {
    const userId = req.session.user.id

    try {
        const connection = await pool.getConnection();
        const [result]: any = await connection.query(
            'INSERT INTO Canvas (ownerID, title, description) VALUES (?, ?, ?)',
            [ userId, "New Project", "" ]
        );
        connection.release();
        res.json({ message: 'Project created', projectId: result.insertId });
    } catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

router.get('/api/getProjects', async (req: Request, res: Response) => {
    const userId = req.session.user.id

    try {
        const connection = await pool.getConnection();
        const [rows]: any = await connection.query(
            'SELECT * FROM Canvas WHERE ownerID = ?',
            [ userId ]
        );
        console.log(rows)
        connection.release();
        res.json({ projects: rows });
    } catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

router.post('/api/deleteProject', async (req: Request, res: Response) => {
    const { projectId } = req.body;
    try {
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM Canvas WHERE id = ?', [ projectId ]);
        connection.release();
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

export default router