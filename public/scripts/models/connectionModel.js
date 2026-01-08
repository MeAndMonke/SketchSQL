export class ConnectionModel {
    constructor(nodeManager) {
        this.nodeManager = nodeManager;
    }

    addConnection(sourceNodeId, sourceRowIndex, targetNodeId, targetRowIndex) {
        // add a connection from source to target
        const value = `${targetNodeId}:${targetRowIndex}`;
        this.nodeManager.updateNode(sourceNodeId, node => {
            const row = node.rows[sourceRowIndex];
            if (!row.foreignKeyTo) row.foreignKeyTo = [];
            if (typeof row.foreignKeyTo === 'string') row.foreignKeyTo = [row.foreignKeyTo];
            if (!row.foreignKeyTo.includes(value)) row.foreignKeyTo.push(value);
            return node;
        });
    }

    deleteConnection(ref) {
        // delete a connection based on reference
        this.nodeManager.updateNode(ref.sourceNodeId, (node) => {
            const row = node.rows[ref.sourceRowIndex];
            if (!row || !row.foreignKeyTo) return node;
            if (!Array.isArray(row.foreignKeyTo)) {
                row.foreignKeyTo = [];
            } else {
                row.foreignKeyTo.splice(ref.connIndex, 1);
            }
            return node;
        });
    }

    updateConnectionRel(ref, rel) {
        // update the properties of a connection
        this.nodeManager.updateNode(ref.sourceNodeId, (node) => {
            const row = node.rows[ref.sourceRowIndex];
            if (!Array.isArray(row.foreignKeyTo)) {
                row.foreignKeyTo = row.foreignKeyTo ? [row.foreignKeyTo] : [];
            }
            row.foreignKeyTo = row.foreignKeyTo.map((entry) => {
                if (entry && typeof entry === 'object') return entry;
                return { target: entry, rel: '1:1' };
            });
            if (row.foreignKeyTo[ref.connIndex]) {
                row.foreignKeyTo[ref.connIndex].rel = rel;
            }
            return node;
        });
    }

    updateConnectionMidX(ref, midXCanvas) {
        // update the midX of a connection
        this.nodeManager.updateNode(ref.sourceNodeId, (node) => {
            const row = node.rows[ref.sourceRowIndex];
            if (!Array.isArray(row.foreignKeyTo)) {
                row.foreignKeyTo = row.foreignKeyTo ? [row.foreignKeyTo] : [];
            }
            row.foreignKeyTo = row.foreignKeyTo.map((entry) => {
                if (entry && typeof entry === 'object') return entry;
                return { target: entry, rel: '1:1' };
            });
            if (row.foreignKeyTo[ref.connIndex]) {
                row.foreignKeyTo[ref.connIndex].midX = midXCanvas;
            } else {
                console.error('Connection not found at index:', ref.connIndex);
            }
            return node;
        });
    }

    updateConnectionMidY(ref, midYCanvas) {
        // update the midY of a connection
        this.nodeManager.updateNode(ref.sourceNodeId, (node) => {
            const row = node.rows[ref.sourceRowIndex];
            if (!Array.isArray(row.foreignKeyTo)) {
                row.foreignKeyTo = row.foreignKeyTo ? [row.foreignKeyTo] : [];
            }
            row.foreignKeyTo = row.foreignKeyTo.map((entry) => {
                if (entry && typeof entry === 'object') return entry;
                return { target: entry, rel: '1:1' };
            });
            if (row.foreignKeyTo[ref.connIndex]) {
                row.foreignKeyTo[ref.connIndex].midY = midYCanvas;
            }
            return node;
        });
    }

    updateConnectionMidPoint(ref, midXCanvas, midYCanvas) {
        // update both midX and midY of a connection
        this.nodeManager.updateNode(ref.sourceNodeId, (node) => {
            const row = node.rows[ref.sourceRowIndex];
            if (!Array.isArray(row.foreignKeyTo)) {
                row.foreignKeyTo = row.foreignKeyTo ? [row.foreignKeyTo] : [];
            }
            row.foreignKeyTo = row.foreignKeyTo.map((entry) => {
                if (entry && typeof entry === 'object') return entry;
                return { target: entry, rel: '1:1' };
            });
            if (row.foreignKeyTo[ref.connIndex]) {
                row.foreignKeyTo[ref.connIndex].midX = midXCanvas;
                row.foreignKeyTo[ref.connIndex].midY = midYCanvas;
            }
            return node;
        });
    }
}
