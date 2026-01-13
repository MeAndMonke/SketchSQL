import { Router } from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../db/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/api/getNodes', async (req: Request, res: Response) => {
    const canvasId = req.query.canvasId as string;
    try {
        const connection = await pool.getConnection();
        const [rows]: any = await connection.query(
            'SELECT * FROM Node WHERE canvasID = ?',
            [ canvasId ] 
        );
        connection.release();
        res.json({ nodes: rows });
    } catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

router.post('/api/saveNode', async (req: Request, res: Response) => {
    const { node } = req.body;
    try {
        const connection = await pool.getConnection();
        await connection.query(`UPDATE Node 
            SET title = ?, 
            nodeIndex = ?, 
            posX = ?,
            posY = ? 
            WHERE id = ? AND canvasID = ?`,
            [ node.title, node.nodeIndex, node.posX, node.posY, node.id, node.canvasId ]);
        connection.release();
        res.json({ message: 'Nodes saved successfully' });
    } catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

router.post('/api/deleteNode', async (req: Request, res: Response) => {
    const { nodeId } = req.body;
    try {
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM Node WHERE id = ?', [ nodeId ]);
        connection.release();
        res.json({ message: 'Node deleted successfully' });
    } catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});


export default router