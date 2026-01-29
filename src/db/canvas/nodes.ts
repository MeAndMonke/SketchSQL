import { Router } from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../db/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

async function loadCanvasState(db: any, canvasId: number) {
    const nodeMap = new Map<number, any>();
    const rowIdToIndex = new Map<number, { nodeId: number, rowIndex: number }>();
    
    const [nodeRows]: any = await db.query(
        'SELECT id, title, nodeIndex, posX, posY FROM Node WHERE canvasID = ? ORDER BY nodeIndex ASC',
        [canvasId]
    );

    const nodeIds = nodeRows.map((n: any) => n.id);
    let rowRows: any[] = [];
    let connectionRows: any[] = [];

    if (nodeIds.length > 0) {
        [rowRows] = await db.query(
            'SELECT * FROM RowEntries WHERE nodeID IN (?) ORDER BY rowIndex ASC',
            [nodeIds]
        );
        const rowIds = rowRows.map((r: any) => r.id);
        if (rowIds.length > 0) {
            [connectionRows] = await db.query(
                'SELECT * FROM Connections WHERE startID IN (?)',
                [rowIds]
            );
        }
    }

    nodeRows.forEach((row: any, idx: number) => {
        nodeMap.set(row.id, {
            id: row.id,
            canvasId,
            name: row.title || `Table${idx + 1}`,
            nodeIndex: row.nodeIndex ?? idx,
            canvasPos: { x: row.posX ?? 80, y: row.posY ?? 80 },
            rows: [],
        });
    });

    rowRows.forEach((row: any, idx: number) => {
        const node = nodeMap.get(row.nodeID);
        if (!node) return;
        const targetIndex = row.rowIndex ?? idx;
        const rowPayload = {
            id: row.id,
            rowIndex: targetIndex,
            name: row.name,
            type: row.type,
            comment: row.comment,
            defaultValue: row.defaultValue,
            indexType: row.indexType,
            nullable: !!row.nullable,
            autoIncrement: !!row.autoIncrement,
            isUnsigned: !!row.isUnsigned,
            foreignKeyTo: [],
        };
        node.rows[targetIndex] = rowPayload;
        rowIdToIndex.set(row.id, { nodeId: row.nodeID, rowIndex: targetIndex });
    });

    connectionRows.forEach((conn: any) => {
        const sourceMeta = rowIdToIndex.get(conn.startID);
        const targetMeta = rowIdToIndex.get(conn.endID);
        if (!sourceMeta || !targetMeta) return;

        const sourceNode = nodeMap.get(sourceMeta.nodeId);
        if (!sourceNode) return;
        const sourceRow = sourceNode.rows[sourceMeta.rowIndex];
        if (!sourceRow) return;

        const targetNodeId = targetMeta.nodeId;
        const targetRowIndex = targetMeta.rowIndex;
        if (!Array.isArray(sourceRow.foreignKeyTo)) sourceRow.foreignKeyTo = [];
        sourceRow.foreignKeyTo.push({
            target: `${targetNodeId}:${targetRowIndex}`,
            rel: conn.relation || '1:1',
            midX: conn.controlDotX ?? undefined,
            midY: conn.controlDotY ?? undefined,
        });
    });

    return { nodes: Array.from(nodeMap.values()) };
}

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

router.get('/api/canvas/:canvasId', async (req: Request, res: Response) => {
    const canvasId = Number(req.params.canvasId);
    if (!Number.isFinite(canvasId)) {
        return res.status(400).json({ message: 'Invalid canvas id' });
    }
    const connection = await pool.getConnection();
    try {
        const payload = await loadCanvasState(connection, canvasId);
        connection.release();
        res.json(payload);
    } catch (error) {
        connection.release();
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

router.post('/api/canvas/:canvasId/sync', async (req: Request, res: Response) => {
    const canvasId = Number(req.params.canvasId);
    const { nodes } = req.body as { nodes: any[] };

    if (!Number.isFinite(canvasId)) {
        return res.status(400).json({ message: 'Invalid canvas id' });
    }
    if (!Array.isArray(nodes)) {
        return res.status(400).json({ message: 'Invalid payload' });
    }

    const db = await pool.getConnection();
    try {
        await db.beginTransaction();

        // 1. Get all existing node IDs for this canvas
        const [existingNodeRows]: any = await db.query('SELECT id FROM Node WHERE canvasID = ?', [canvasId]);
        const existingNodeIds = new Set((existingNodeRows as any[]).map((row) => row.id));

        // 2. Track which node IDs are kept
        const keptNodeIds = new Set<number>();

        const nodeIdMap = new Map<any, number>();
        const rowIdMap = new Map<number, number[]>();
        const nodePosMap = new Map<number, { x: number; y: number }>(); // Track node positions

        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            const title = node.name || node.title || `Table${i + 1}`;
            const nodeIndex = i; // persist UI order
            const posX = node.canvasPos?.x ?? node.posX ?? 80;
            const posY = node.canvasPos?.y ?? node.posY ?? 80;

            let nodeId = node.id as number;
            if (nodeId && nodeId > 0 && existingNodeIds.has(nodeId)) {
                await db.query(
                    'UPDATE Node SET title = ?, nodeIndex = ?, posX = ?, posY = ? WHERE id = ? AND canvasID = ?',
                    [title, nodeIndex, posX, posY, nodeId, canvasId]
                );
                keptNodeIds.add(nodeId);
            } else {
                const [result]: any = await db.query(
                    'INSERT INTO Node (canvasID, title, nodeIndex, posX, posY) VALUES (?, ?, ?, ?, ?)',
                    [canvasId, title, nodeIndex, posX, posY]
                );
                nodeId = result.insertId;
                keptNodeIds.add(nodeId);
            }

            nodeIdMap.set(node.id ?? `new-${i}`, nodeId);
            nodePosMap.set(nodeId, { x: posX, y: posY });

            const [existingRows]: any = await db.query('SELECT id FROM RowEntries WHERE nodeID = ?', [nodeId]);
            const keepIds = new Set<number>();
            const rowIdsForNode: number[] = [];

            for (let r = 0; r < (node.rows || []).length; r += 1) {
                const row = node.rows[r];
                const rowIndex = r; // persist current order from UI
                let rowId = row.id as number | undefined;

                const safeName = row.name ?? '';
                const safeType = row.type ?? '';
                const safeComment = row.comment ?? '';
                const safeDefault = row.defaultValue ?? '';
                const safeIndexType = row.indexType ?? 'None';
                const safeNullable = !!row.nullable;
                const safeAutoInc = !!row.autoIncrement;
                const safeUnsigned = !!row.isUnsigned;

                if (rowId && rowId > 0) {
                    await db.query(
                        `UPDATE RowEntries
                            SET rowIndex = ?, name = ?, type = ?, comment = ?, defaultValue = ?, indexType = ?, nullable = ?, autoIncrement = ?, isUnsigned = ?
                         WHERE id = ?`,
                        [rowIndex, safeName, safeType, safeComment, safeDefault, safeIndexType, safeNullable, safeAutoInc, safeUnsigned, rowId]
                    );
                } else {
                    const [rowResult]: any = await db.query(
                        `INSERT INTO RowEntries (nodeID, rowIndex, name, type, comment, defaultValue, indexType, nullable, autoIncrement, isUnsigned)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [nodeId, rowIndex, safeName, safeType, safeComment, safeDefault, safeIndexType, safeNullable, safeAutoInc, safeUnsigned]
                    );
                    rowId = rowResult.insertId;
                }

                keepIds.add(rowId as number);
                rowIdsForNode[rowIndex] = rowId as number;
            }

            const deleteIds = (existingRows as any[])
                .map((r) => r.id)
                .filter((id) => !keepIds.has(id));
            if (deleteIds.length > 0) {
                await db.query('DELETE FROM RowEntries WHERE id IN (?)', [deleteIds]);
            }

            rowIdMap.set(nodeId, rowIdsForNode);
        }

        // 3. Delete nodes that are not kept
        const nodesToDelete = Array.from(existingNodeIds).filter((id) => !keptNodeIds.has(id));
        if (nodesToDelete.length > 0) {
            // Delete related rows and connections first (to maintain referential integrity)
            const [rowsToDelete]: any = await db.query('SELECT id FROM RowEntries WHERE nodeID IN (?)', [nodesToDelete]);
            const rowIdsToDelete = (rowsToDelete as any[]).map((r) => r.id);
            if (rowIdsToDelete.length > 0) {
                await db.query('DELETE FROM Connections WHERE startID IN (?)', [rowIdsToDelete]);
                await db.query('DELETE FROM RowEntries WHERE id IN (?)', [rowIdsToDelete]);
            }
            await db.query('DELETE FROM Node WHERE id IN (?)', [nodesToDelete]);
        }

        const nodeIds = Array.from(nodeIdMap.values());
        const allRowIds = Array.from(rowIdMap.values()).flat().filter(Boolean);
        if (allRowIds.length > 0) {
            await db.query('DELETE FROM Connections WHERE startID IN (?)', [allRowIds]);
        }

        const ROW_HEIGHT = 28;
        const NODE_TITLE_HEIGHT = 40;
        const ESTIMATED_NODE_WIDTH = 200;

        for (let n = 0; n < nodes.length; n += 1) {
            const node = nodes[n];
            const sourceNodeId = nodeIdMap.get(node.id ?? `new-${n}`) as number;
            const sourceRowIds = rowIdMap.get(sourceNodeId) || [];
            const sourcePos = nodePosMap.get(sourceNodeId) || { x: 80, y: 80 };

            for (let rowIdx = 0; rowIdx < (node.rows || []).length; rowIdx += 1) {
                const row = node.rows[rowIdx];
                const fromRowId = sourceRowIds[rowIdx];
                if (!fromRowId || !row.foreignKeyTo) continue;

                const entries = Array.isArray(row.foreignKeyTo) ? row.foreignKeyTo : [row.foreignKeyTo];

                for (const entry of entries) {
                    const targetVal = entry?.target ?? entry;
                    if (!targetVal) continue;

                    let targetNodeKey: any = null;
                    let targetRowIndex = 0;

                    if (typeof targetVal === 'string' && targetVal.includes(':')) {
                        const [nodePart, rowPart] = targetVal.split(':');
                        targetNodeKey = Number(nodePart);
                        targetRowIndex = Number(rowPart) || 0;
                    } else {
                        targetNodeKey = targetVal;
                        targetRowIndex = 0;
                    }

                    const targetNodeId = nodeIdMap.get(targetNodeKey);
                    if (!targetNodeId) continue;
                    const targetRows = rowIdMap.get(targetNodeId) || [];
                    const toRowId = targetRows[targetRowIndex];
                    if (!toRowId) continue;

                    const targetPos = nodePosMap.get(targetNodeId) || { x: 200, y: 200 };

                    const rel = entry?.rel || '1:1';

                    // Frontend is the source of truth for midpoints.
                    // Persist only when client provides grid coords; otherwise store NULL.
                    const midX = Number.isFinite(entry?.midX) ? entry.midX : null;
                    const midY = Number.isFinite(entry?.midY) ? entry.midY : null;

                    await db.query(
                        'INSERT INTO Connections (startID, endID, relation, controlDotX, controlDotY) VALUES (?, ?, ?, ?, ?)',
                        [fromRowId, toRowId, rel, midX, midY]
                    );
                }
            }
        }

        await db.commit();

        const payload = await loadCanvasState(db, canvasId);
        db.release();
        res.json(payload);
    } catch (error) {
        await db.rollback();
        db.release();
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