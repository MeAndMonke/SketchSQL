import { PopupMenu } from './popupMenu.js';

export class InteractionController {
    constructor(canvasEl, nodeManager, viewport, nodeLayer, connectionLayer, connectionModel, grid = null) {
        this.canvas = canvasEl;
        this.nodeManager = nodeManager;
        this.viewport = viewport;
        this.nodes = nodeLayer;
        this.connections = connectionLayer;
        this.model = connectionModel;
        this.grid = grid;
        this.menu = new PopupMenu();

        this.draggingNode = null; // id
        this.dragOffset = { x: 0, y: 0 };
        this.drawingConnection = false;
        this.connectionStart = null; // { nodeId, rowIndex, dotElement }
        this.draggingLine = null; // { ref, startX, moved: false }

        this._wireEvents();
        this._wireConnectionClicks();
    }

    _wireEvents() {
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('wheel', (e) => this.viewport.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this._onMouseUp(e));
    }

    _wireConnectionClicks() {
        this.connections.onClick = (evt, ref) => {
            this.menu.show(evt.pageX, evt.pageY, [
                { label: '🗑', title: 'Delete connection', className: 'menu-trash', onClick: () => this.model.deleteConnection(ref) },
            ]);
        };
    }

    _onMouseDown(e) {
        if (e.button === 2) {
            e.preventDefault();
            this.viewport.beginPan(e.clientX, e.clientY);
            return;
        }
        if (e.button !== 0) return;

        // Check for connection dot first, even under SVG
        let connectionDot = e.target.closest('.connection-dot');
        if (!connectionDot) {
            const stack = document.elementsFromPoint(e.clientX, e.clientY);
            connectionDot = stack.find(el => el.classList && el.classList.contains('connection-dot')) || null;
        }
        if (connectionDot) {
            e.preventDefault();
            e.stopPropagation();
            this._beginDrawConnection(connectionDot);
            return;
        }

        // Check for control dot on connection line
        if (e.target.classList && e.target.classList.contains('connection-control-dot')) {
            const g = e.target.closest('g[data-source-node-id]');
            if (g) {
                e.preventDefault();
                const ref = {
                    sourceNodeId: parseInt(g.dataset.sourceNodeId, 10),
                    sourceRowIndex: parseInt(g.dataset.sourceRowIndex, 10),
                    targetNodeId: parseInt(g.dataset.targetNodeId, 10),
                    targetRowIndex: parseInt(g.dataset.targetRowIndex, 10),
                    connIndex: parseInt(g.dataset.connIndex, 10),
                    rel: g.dataset.rel || '1:N'
                };
                const canvasCoords = this.viewport.toCanvasCoords(e.clientX, e.clientY);
                this.draggingLine = { ref, startX: canvasCoords.x, moved: false };
                return;
            }
        }

        // If click is on a connection line (SVG path), it's for the menu
        const inSvg = e.target.closest('#connectionSvg');
        if (inSvg) {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'path') {
                // Let the click event handle showing the menu
                return;
            }
            // clicked empty svg area, try to drag node underneath
        }

        // Resolve underlying node even if an overlay element is on top
        let target = e.target.closest('.canvas-node');
        if (!target) {
            const stack = document.elementsFromPoint(e.clientX, e.clientY);
            target = stack.find(el => el.classList && el.classList.contains('canvas-node')) || null;
        }
        if (target) {
            const nodeId = parseInt(target.dataset.nodeId, 10);
            const nd = this.nodes.getNodesMap().get(nodeId);
            if (nd) {
                this.nodes.select(nodeId);
                this.draggingNode = nodeId;
                const { x, y } = this.viewport.toCanvasCoords(e.clientX, e.clientY);
                this.dragOffset = { x: x - nd.x, y: y - nd.y };
                target.style.zIndex = '1000';
                this.nodes.setDraggingId(nodeId);
            }
        } else {
            this.nodes.select(null);
        }
    }

    _onMouseMove(e) {
        if (this.viewport.isPanning) {
            this.viewport.panMove(e.clientX, e.clientY);
            return;
        }

        if (this.drawingConnection) {
            this.connections.updateTempTo(e.clientX, e.clientY);
            return;
        }

        if (this.draggingLine) {
            this.draggingLine.moved = true;
            const canvasCoords = this.viewport.toCanvasCoords(e.clientX, e.clientY);
            let midX = canvasCoords.x;
            let midY = canvasCoords.y;
            if (this.grid) {
                midX = this.grid.snap(midX);
                midY = this.grid.snap(midY);
            }
            this.model.updateConnectionMidPoint(this.draggingLine.ref, midX, midY);
            return;
        }

        if (!this.draggingNode) return;
        const nd = this.nodes.getNodesMap().get(this.draggingNode);
        const el = this.nodes.getNodeElement(this.draggingNode);
        const { x, y } = this.viewport.toCanvasCoords(e.clientX, e.clientY);
        let nx = x - this.dragOffset.x;
        let ny = y - this.dragOffset.y;
        if (this.grid) {
            nx = this.grid.snap(nx);
            ny = this.grid.snap(ny);
        }
        nd.x = nx;
        nd.y = ny;
        if (el) {
            el.style.left = `${nd.x}px`;
            el.style.top = `${nd.y}px`;
        }
    }

    _onMouseUp(e) {
        if (this.viewport.isPanning && e.button === 2) {
            this.viewport.endPan();
            return;
        }

        if (this.draggingLine) {
            const wasMoved = this.draggingLine.moved;
            this.draggingLine = null;
            // If we moved, prevent the click event that would show the menu
            if (wasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
            return;
        }

        if (this.drawingConnection) {
            // Look through all elements at cursor position to find connection dot
            let targetDot = document.elementFromPoint(e.clientX, e.clientY)?.closest('.connection-dot');
            if (!targetDot) {
                const stack = document.elementsFromPoint(e.clientX, e.clientY);
                targetDot = stack.find(el => el.classList && el.classList.contains('connection-dot')) || null;
            }
            
            if (targetDot) {
                const targetRow = targetDot.closest('.canvas-node-row');
                const targetNode = targetDot.closest('.canvas-node');
                const targetNodeId = parseInt(targetNode.dataset.nodeId, 10);
                const targetRowIndex = Array.from(targetNode.querySelectorAll('.canvas-node-row')).indexOf(targetRow);
                const targetIsLeftDot = targetDot.classList.contains('left');
                
                // Determine connection direction
                // Convention: connections stored as right->left (output->input)
                let sourceNodeId, sourceRowIndex, destNodeId, destRowIndex;
                
                if (!this.connectionStart.isLeftDot && targetIsLeftDot) {
                    // Right to left (normal direction)
                    sourceNodeId = this.connectionStart.nodeId;
                    sourceRowIndex = this.connectionStart.rowIndex;
                    destNodeId = targetNodeId;
                    destRowIndex = targetRowIndex;
                } else if (this.connectionStart.isLeftDot && !targetIsLeftDot) {
                    // Left to right (reverse, so swap)
                    sourceNodeId = targetNodeId;
                    sourceRowIndex = targetRowIndex;
                    destNodeId = this.connectionStart.nodeId;
                    destRowIndex = this.connectionStart.rowIndex;
                } else {
                    // Both left or both right - allow but use original order
                    sourceNodeId = this.connectionStart.nodeId;
                    sourceRowIndex = this.connectionStart.rowIndex;
                    destNodeId = targetNodeId;
                    destRowIndex = targetRowIndex;
                }
                
                this.model.addConnection(sourceNodeId, sourceRowIndex, destNodeId, destRowIndex);
            }
            this.connections.hideTemp();
            this.nodes.showConnectionDotsAcross(false);
            this.drawingConnection = false;
            this.connectionStart = null;
            return;
        }

        if (this.draggingNode) {
            const nodeId = this.draggingNode;
            const nd = this.nodes.getNodesMap().get(nodeId);
            this.nodeManager.updateNode(nodeId, node => {
                const x = this.grid ? this.grid.snap(nd.x) : nd.x;
                const y = this.grid ? this.grid.snap(nd.y) : nd.y;
                node.canvasPos = { x, y };
                return node;
            });
            const el = this.nodes.getNodeElement(nodeId);
            if (el) el.style.zIndex = '1';
            this.draggingNode = null;
            this.nodes.setDraggingId(null);
        }
    }

    _beginDrawConnection(dotElement) {
        const row = dotElement.closest('.canvas-node-row');
        const node = dotElement.closest('.canvas-node');
        const nodeId = parseInt(node.dataset.nodeId, 10);
        const rowIndex = Array.from(node.querySelectorAll('.canvas-node-row')).indexOf(row);
        const isLeftDot = dotElement.classList.contains('left');
        this.drawingConnection = true;
        this.connectionStart = { nodeId, rowIndex, dotElement, isLeftDot };
        this.nodes.showConnectionDotsAcross(true);
        this.connections.showTempFromDot(dotElement);
    }
}
