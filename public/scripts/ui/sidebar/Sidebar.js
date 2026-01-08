import { rememberExpanded } from './expandedState.js';
import { createNodeElement } from './createNodeElement.js';
import { attachEventListeners } from './events.js';

export class Sidebar {
    constructor({ sidebarElement, nodeManager, typeOptions, colorPalette }) {
        this.sidebarElement = sidebarElement;
        this.nodeManager = nodeManager;
        this.typeOptions = typeOptions;
        this.colorPalette = colorPalette;
        this.expandedNodes = new Set();
    }

    render() {
        rememberExpanded(this);
        const nodes = this.nodeManager.getNodes();

        this.sidebarElement.innerHTML = '';
        nodes.forEach(node => {
            const nodeEl = createNodeElement(this, node);
            this.sidebarElement.appendChild(nodeEl);
        });

        // restore expansion
        this.sidebarElement.querySelectorAll('.nodeList').forEach(list => {
            const nodeId = parseInt(list.parentElement.dataset.nodeId, 10);
            if (this.expandedNodes.has(nodeId)) {
                list.style.display = 'block';
            }
        });

        attachEventListeners(this);
        // trigger any downstream sync
        this.nodeManager.setNodes(this.nodeManager.getNodes());
    }
}
