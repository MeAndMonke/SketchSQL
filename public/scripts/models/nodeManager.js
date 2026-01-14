const SAVE_DEBOUNCE_MS = 600;

export class NodeManager {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.nodes = [];
        this._saveTimer = null;
    }

    async init() {
        await this.reloadFromServer();
    }

    getNodes() {
        return this.nodes;
    }

    setNodes(nodes) {
        this.nodes = nodes;
        this._queueSave();
    }

    addNode(newNode) {
        const tempId = -Date.now();
        const withDefaults = {
            id: newNode.id ?? tempId,
            canvasId: this.canvasId,
            canvasPos: newNode.canvasPos || { x: 80, y: 80 },
            rows: newNode.rows || [],
            ...newNode,
        };
        this.nodes = [...this.nodes, withDefaults];
        this._queueSave();
    }

    removeNode(nodeId) {
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        this._queueSave();
    }

    updateNode(nodeId, updater) {
        this.nodes = this.nodes.map(n => {
            if (n.id !== nodeId) return n;
            const clone = JSON.parse(JSON.stringify(n));
            return updater(clone);
        });
        this._queueSave();
    }

    async reloadFromServer() {
        const res = await fetch(`/api/canvas/${this.canvasId}`);
        if (!res.ok) {
            console.error('Failed to load canvas data');
            this.nodes = [];
            return;
        }
        const data = await res.json();
        this.nodes = (data?.nodes || []).map((node) => ({
            ...node,
            canvasPos: node.canvasPos || { x: node.posX || 80, y: node.posY || 80 },
        }));
    }

    _queueSave() {
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            this._saveTimer = null;
            this._saveToServer().catch((err) => console.error('Save failed', err));
        }, SAVE_DEBOUNCE_MS);
    }

    async _saveToServer() {
        const payload = { nodes: this.nodes };
        const res = await fetch(`/api/canvas/${this.canvasId}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            console.error('Failed to save canvas data');
            return;
        }

        const data = await res.json();
        if (Array.isArray(data?.nodes)) {
            this.nodes = data.nodes.map((node) => ({
                ...node,
                canvasPos: node.canvasPos || { x: node.posX || 80, y: node.posY || 80 },
            }));
        }
    }
}
