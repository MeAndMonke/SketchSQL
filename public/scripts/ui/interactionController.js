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

        this.keyEventDone = false;

        this.draggingNode = null; // id
        this.dragOffset = { x: 0, y: 0 };
        this.drawingConnection = false;
        this.connectionStart = null;
        this.draggingLine = null;

        this._wireEvents();
        this._wireConnectionClicks();
    }

    _wireEvents() {
        // prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('wheel', (e) => this.viewport.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this._onMouseUp(e));
    }

    _wireConnectionClicks() {
        // show popup menu on connection click
        this.connections.onClick = (evt, ref) => {
            this.menu.show(evt.pageX, evt.pageY, [
                { label: 'N:1', title: 'Many to One', className: 'menu-rel', onClick: () => {
                    this.model.updateConnectionRel(ref, 'N:1');
                    this._redrawConnections();
                }},
                { label: '1:1', title: 'One to One', className: 'menu-rel', onClick: () => {
                    this.model.updateConnectionRel(ref, '1:1');
                    this._redrawConnections();
                }},
                { label: '1:N', title: 'One to Many', className: 'menu-rel', onClick: () => {
                    this.model.updateConnectionRel(ref, '1:N');
                    this._redrawConnections();
                }},
                { label: '🗑', title: 'Delete connection', className: 'menu-trash', onClick: () => this.model.deleteConnection(ref) },
            ]);
        };
    }
    
    _redrawConnections() {
        // redraw all connections
        const nodes = this.nodeManager.getNodes();
        const nodesMap = this.nodes.getNodesMap();
        this.connections.drawConnections(nodes, nodesMap);
    }

    _onMouseDown(e) {
        // check for connection dot
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

        // check for connection control dot (to drag line)
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
                    rel: g.dataset.rel || '1:1'
                };
                const canvasCoords = this.viewport.toCanvasCoords(e.clientX, e.clientY);
                this.draggingLine = { ref, startX: canvasCoords.x, moved: false };
                return;
            }
        }

        // check for clicks on empty connection area
        const inSvg = e.target.closest('#connectionSvg');
        if (inSvg) {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'path') {
                return;
            }
        }

        // check for node element
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
                return;
            }
        } else {
            this.nodes.select(null);
        }

        // left button for panning
        if (e.button === 0) {
            e.preventDefault();
            this.viewport.beginPan(e.clientX, e.clientY);
            return;
        }
        if (e.button !== 0) return;
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
            
            // Always convert to grid coordinates
            const gridSize = this.grid ? this.grid.size : 20;
            if (this.grid) {
                midX = this.grid.snap(midX);
                midY = this.grid.snap(midY);
            }
            // Convert pixels to grid cell positions
            midX = midX / gridSize;
            midY = midY / gridSize;
            
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
        if (this.viewport.isPanning && e.button === 0) {
            this.viewport.endPan();
            return;
        }

        if (this.draggingLine) {
            const wasMoved = this.draggingLine.moved;
            this.draggingLine = null;
            // if it was moved prevent other actions
            if (wasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
            return;
        }

        if (this.drawingConnection) {
            // check if released over a connection dot
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
                
                // determine source and destination based on dot sides
                let sourceNodeId, sourceRowIndex, destNodeId, destRowIndex;
                
                if (!this.connectionStart.isLeftDot && targetIsLeftDot) {
                    // Right to left
                    sourceNodeId = this.connectionStart.nodeId;
                    sourceRowIndex = this.connectionStart.rowIndex;
                    destNodeId = targetNodeId;
                    destRowIndex = targetRowIndex;
                } else if (this.connectionStart.isLeftDot && !targetIsLeftDot) {
                    // Left to right
                    sourceNodeId = targetNodeId;
                    sourceRowIndex = targetRowIndex;
                    destNodeId = this.connectionStart.nodeId;
                    destRowIndex = this.connectionStart.rowIndex;
                } else {
                    // Invalid connection (same side), abort
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

        // finalize node dragging
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
        // start drawing a connection from this dot
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
