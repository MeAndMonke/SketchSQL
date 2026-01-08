import { colorPalette, getColorForNode } from '../config/colors.js';

export class NodeLayer {
    constructor(transformContainer, nodeManager) {
        this.container = transformContainer;
        this.nodeManager = nodeManager;
        this.nodes = new Map();
        this.selectedId = null;
        this.draggingId = null;
        this.colorPalette = colorPalette;
    }

    setDraggingId(idOrNull) {
        this.draggingId = idOrNull;
    }

    getNodeElement(id) {
        return this.nodes.get(id)?.element || null;
    }

    getNodesMap() {
        return this.nodes;
    }

    select(idOrNull) {
        // clear selection
        this.nodes.forEach(nd => nd.element.classList.remove('selected'));
        this.selectedId = idOrNull;
        if (idOrNull != null) {
            const nd = this.nodes.get(idOrNull);
            if (nd) nd.element.classList.add('selected');
        }
    }

    showConnectionDotsAcross(show) {
        this.nodes.forEach(nd => {
            nd.element.classList.toggle('connection-available', !!show);
        });
    }

    sync() {
        const nodes = this.nodeManager.getNodes();
        const ids = new Set(nodes.map(n => n.id));

        // remove missing
        for (const [id, nd] of this.nodes) {
            if (!ids.has(id)) {
                nd.element.remove();
                this.nodes.delete(id);
            }
        }

        // add/update
        nodes.forEach(node => {
            if (!this.nodes.has(node.id)) {
                const nd = {
                    x: node.canvasPos?.x || (50 + Math.random() * 300),
                    y: node.canvasPos?.y || (50 + Math.random() * 300),
                    element: null
                };
                const el = this._createNodeElement(node, nd);
                nd.element = el;
                this.container.appendChild(el);
                this.nodes.set(node.id, nd);
            } else {
                const nd = this.nodes.get(node.id);
                // content update
                this._updateNodeContent(nd.element, node);
                // position update (skip while dragging)
                if (node.canvasPos && this.draggingId !== node.id) {
                    nd.x = node.canvasPos.x;
                    nd.y = node.canvasPos.y;
                    nd.element.style.left = `${nd.x}px`;
                    nd.element.style.top = `${nd.y}px`;
                }
            }
        });
    }

    _createNodeElement(node, nd) {
        const element = document.createElement('div');
        element.className = 'canvas-node';
        element.dataset.nodeId = node.id;
        element.style.left = `${nd.x}px`;
        element.style.top = `${nd.y}px`;

        const title = document.createElement('div');
        title.className = 'canvas-node-title';
        title.textContent = node.name;
        
        // style title with color
        const color = getColorForNode(this.nodeManager, node.id);
        title.style.background = `linear-gradient(135deg, ${color.bg} 0%, ${color.bg} 100%)`;
        title.style.borderBottom = `2px solid ${color.border}`;

        const rows = document.createElement('div');
        rows.className = 'canvas-node-rows';
        this._fillRows(rows, node);

        element.appendChild(title);
        element.appendChild(rows);
        return element;
    }

    _updateNodeContent(element, node) {
        // update title and rows
        const title = element.querySelector('.canvas-node-title');
        if (title) title.textContent = node.name;
        const rows = element.querySelector('.canvas-node-rows');
        if (rows) {
            rows.innerHTML = '';
            this._fillRows(rows, node);
        }
    }

    _fillRows(rowsContainer, node) {
        if (!node.rows || node.rows.length === 0) return;
        node.rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'canvas-node-row';
            rowEl.style.position = 'relative';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'canvas-node-row-name';
            
            if (row.indexType === 'Primary key') {
                const img = document.createElement('img');
                img.src = '../svg/key.svg';
                img.alt = '';
                img.style.marginRight = '4px';
                img.style.width = '12px';
                nameSpan.appendChild(img);
                nameSpan.appendChild(document.createTextNode(row.name));
            } else if (row.indexType === 'Unique key') {
                const img = document.createElement('img');
                img.src = '../svg/unique.svg';
                img.alt = '';
                img.style.marginRight = '4px';
                img.style.width = '12px';
                nameSpan.appendChild(img);
                nameSpan.appendChild(document.createTextNode(row.name));
            } else if (row.indexType === 'Index') {
                const img = document.createElement('img');
                img.src = '../svg/index.svg';
                img.alt = '';
                img.style.marginRight = '4px';
                img.style.width = '12px';
                nameSpan.appendChild(img);
                nameSpan.appendChild(document.createTextNode(row.name));
            } else {
                const spacer = document.createElement('span');
                spacer.style.display = 'inline-block';
                spacer.style.width = '16px'; // space for icons
                nameSpan.appendChild(spacer);
                nameSpan.appendChild(document.createTextNode(row.name));
            }

            const typeSpan = document.createElement('span');
            typeSpan.className = 'canvas-node-row-type';
            typeSpan.textContent = row.type;

            // Create attributes container for comment and default icons
            const attributesSpan = document.createElement('span');
            attributesSpan.className = 'canvas-node-row-attributes';
            
            if (row.comment) {
                const commentImg = document.createElement('img');
                commentImg.src = '../svg/comment.svg';
                commentImg.alt = 'Comment';
                commentImg.title = row.comment;
                commentImg.style.width = '12px';
                commentImg.style.marginRight = '4px';
                attributesSpan.appendChild(commentImg);
            }
            
            if (row.defaultValue !== undefined && row.defaultValue !== '') {
                const defaultSpan = document.createElement('img');
                defaultSpan.src = '../svg/bookmark.svg';
                defaultSpan.alt = 'Default value';
                defaultSpan.title = `Default: ${row.defaultValue}`;
                defaultSpan.style.width = '12px';
                attributesSpan.appendChild(defaultSpan);
            }

            const leftDot = document.createElement('div');
            leftDot.className = 'connection-dot left';
            const rightDot = document.createElement('div');
            rightDot.className = 'connection-dot right';

            rowEl.appendChild(leftDot);
            rowEl.appendChild(nameSpan);
            if (attributesSpan.children.length > 0) {
                rowEl.appendChild(attributesSpan);
            }
            rowEl.appendChild(typeSpan);
            
            // add multiple right dots if specified
            const dotCount = row.dotCount || 1;
            for (let i = 0; i < dotCount; i++) {
                const dot = document.createElement('div');
                dot.className = 'connection-dot right';
                rowEl.appendChild(dot);
            }
            
            rowsContainer.appendChild(rowEl);
        });
    }
}
