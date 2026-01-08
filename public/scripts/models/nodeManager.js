export class NodeManager {
    constructor(storageKey = 'nodes') {
        this.storageKey = storageKey;
        this.nodes = this.loadNodes();
    }

    getNodes() {
        return this.nodes;
    }

    setNodes(nodes) {
        this.nodes = nodes;
        this.saveNodes();
    }

    addNode(newNode) {
        this.nodes = [...this.nodes, newNode];
        this.saveNodes();
    }

    removeNode(nodeId) {
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        this.saveNodes();
    }

    updateNode(nodeId, updater) {
        this.nodes = this.nodes.map(n => {
            if (n.id !== nodeId) return n;
            const clone = JSON.parse(JSON.stringify(n));
            return updater(clone);
        });
        this.saveNodes();
    }

    saveNodes() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.nodes));
    }

    loadNodes() {
        const saved = localStorage.getItem(this.storageKey);
        if (!saved) return [];
        try {
            return JSON.parse(saved);
        } catch (err) {
            console.warn('Failed to parse stored nodes, resetting.', err);
            return [];
        }
    }
}
