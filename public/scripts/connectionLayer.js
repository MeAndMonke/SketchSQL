export class ConnectionLayer {
    constructor(canvasEl, svgEl, nodeManager, grid = null, viewport = null) {
        this.canvas = canvasEl;
        this.svg = svgEl;
        this.nodeManager = nodeManager;
        this.grid = grid;
        this.viewport = viewport; // used for coordinate conversions
        this.onClick = null; // external click handler
        this._tempPath = null;

        // Delegate clicks to the SVG so redraws don't drop handlers
        if (!this._delegated) {
            this.svg.addEventListener('click', (evt) => {
                const g = evt.target.closest('g[data-source-node-id]');
                if (!g) {
                    return;
                }
                if (typeof this.onClick !== 'function') {
                    return;
                }
                const ref = {
                    sourceNodeId: parseInt(g.dataset.sourceNodeId, 10),
                    sourceRowIndex: parseInt(g.dataset.sourceRowIndex, 10),
                    targetNodeId: parseInt(g.dataset.targetNodeId, 10),
                    targetRowIndex: parseInt(g.dataset.targetRowIndex, 10),
                    connIndex: parseInt(g.dataset.connIndex, 10),
                    rel: g.dataset.rel || '1:N'
                };
                this.onClick(evt, ref);
            }, true); // use capture phase
            this._delegated = true;
        }
    }

    clear() {
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    }

    resizeToCanvas() {
        this.svg.setAttribute('width', this.canvas.offsetWidth);
        this.svg.setAttribute('height', this.canvas.offsetHeight);
    }

    drawConnections(nodes, canvasNodes) {
        this.clear();
        this.resizeToCanvas();
        const panX = this.viewport ? this.viewport.panX : 0;
        const panY = this.viewport ? this.viewport.panY : 0;
        const zoom = this.viewport ? this.viewport.zoom : 1;

        nodes.forEach(sourceNode => {
            if (!sourceNode.rows) return;
            sourceNode.rows.forEach((row, rowIndex) => {
                if (!row.foreignKeyTo) return;

                const raw = Array.isArray(row.foreignKeyTo) ? row.foreignKeyTo : [row.foreignKeyTo];
                const connections = raw.map((entry) => {
                    if (entry && typeof entry === 'object') {
                        return { target: entry.target ?? entry, rel: entry.rel ?? '1:N', midX: entry.midX, midY: entry.midY };
                    }
                    return { target: entry, rel: '1:N' };
                });

                connections.forEach((conn, connIndex) => {
                    let targetNodeId, targetRowIndex;
                    if (typeof conn.target === 'string' && conn.target.includes(':')) {
                        [targetNodeId, targetRowIndex] = conn.target.split(':');
                        targetRowIndex = parseInt(targetRowIndex, 10);
                    } else {
                        targetNodeId = conn.target;
                        targetRowIndex = 0;
                    }

                    const targetNode = nodes.find(n => n.id === parseInt(targetNodeId, 10));
                    if (!targetNode) return;

                    const sourceElement = canvasNodes.get(sourceNode.id)?.element;
                    const targetElement = canvasNodes.get(targetNode.id)?.element;
                    if (!sourceElement || !targetElement) return;

                    const sourceBounds = sourceElement.getBoundingClientRect();
                    const targetBounds = targetElement.getBoundingClientRect();
                    const canvasBounds = this.canvas.getBoundingClientRect();

                    const sourceRows = sourceElement.querySelectorAll('.canvas-node-row');
                    const sourceRowElement = sourceRows[rowIndex];
                    const sourceRowBounds = sourceRowElement?.getBoundingClientRect();
                    const sourceRowY = sourceRowBounds ? sourceRowBounds.top - canvasBounds.top + sourceRowBounds.height / 2 : sourceBounds.top - canvasBounds.top + 50;

                    const targetRows = targetElement.querySelectorAll('.canvas-node-row');
                    const targetRowElement = targetRows[targetRowIndex];
                    const targetRowBounds = targetRowElement?.getBoundingClientRect();
                    const targetRowY = targetRowBounds ? targetRowBounds.top - canvasBounds.top + targetRowBounds.height / 2 : targetBounds.top - canvasBounds.top + 50;

                    // Screen-relative (within canvas) positions
                    const x1r = sourceBounds.right - canvasBounds.left;
                    const y1r = sourceRowY;
                    const x2r = targetBounds.left - canvasBounds.left;
                    const y2r = targetRowY;

                    // Convert to canvas coordinate space
                    let x1c = (x1r - panX) / zoom;
                    let y1c = (y1r - panY) / zoom;
                    let x2c = (x2r - panX) / zoom;
                    let y2c = (y2r - panY) / zoom;

                    // Snap X only; keep Y centered on row visuals
                    if (this.grid) {
                        x1c = this.grid.snap(x1c);
                        x2c = this.grid.snap(x2c);
                    }

                    // Use stored midX if available, otherwise compute default
                    let midXc;
                    if (conn.midX !== undefined) {
                        midXc = this.grid ? this.grid.snap(conn.midX) : conn.midX;
                    } else {
                        midXc = (x1c + x2c) / 2;
                        if (this.grid) midXc = this.grid.snap(midXc);
                    }

                    // Calculate stub positions in canvas space and snap to grid
                    const stubSize = this.grid ? this.grid.size : 20;
                    const x1StubC = x1c + stubSize;
                    const x2StubC = x2c - stubSize;

                    // Convert all points to screen-relative for drawing
                    const x1 = panX + x1c * zoom;
                    const y1 = panY + y1c * zoom;
                    const x2 = panX + x2c * zoom;
                    const y2 = panY + y2c * zoom;
                    const midX = panX + midXc * zoom;
                    const x1Stub = panX + x1StubC * zoom;
                    const x2Stub = panX + x2StubC * zoom;

                    // Create orthogonal path with stubs
                    let d;
                    if (conn.midY !== undefined) {
                        // User has customized the routing - use 3-segment path through control point
                        const midYc = this.grid ? this.grid.snap(conn.midY) : conn.midY;
                        const midY = panY + midYc * zoom;
                        d = `M ${x1} ${y1} L ${x1Stub} ${y1} L ${midX} ${y1} L ${midX} ${midY} L ${x2Stub} ${midY} L ${x2Stub} ${y2} L ${x2} ${y2}`;
                    } else {
                        // Default routing - simple 2-segment path with stubs
                        d = `M ${x1} ${y1} L ${x1Stub} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2Stub} ${y2} L ${x2} ${y2}`;
                    }

                    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

                    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    hit.setAttribute('d', d);
                    hit.setAttribute('stroke', '#000');
                    hit.setAttribute('stroke-width', '20');
                    hit.setAttribute('fill', 'none');
                    hit.setAttribute('opacity', '0');
                    hit.setAttribute('pointer-events', 'stroke');

                    const visible = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    visible.setAttribute('d', d);
                    visible.setAttribute('stroke', '#5b9dd9');
                    visible.setAttribute('stroke-width', '3');
                    visible.setAttribute('fill', 'none');
                    visible.setAttribute('stroke-linecap', 'round');
                    visible.style.cursor = 'pointer';

                    // Annotate group for delegated click handling
                    group.dataset.sourceNodeId = String(sourceNode.id);
                    group.dataset.sourceRowIndex = String(rowIndex);
                    group.dataset.targetNodeId = String(targetNode.id);
                    group.dataset.targetRowIndex = String(targetRowIndex);
                    group.dataset.connIndex = String(connIndex);
                    group.dataset.rel = String(conn.rel || '1:N');

                    group.appendChild(hit);
                    group.appendChild(visible);

                    // Add draggable control point
                    const controlDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    controlDot.setAttribute('cx', midX);
                    if (conn.midY !== undefined) {
                        const midYc = conn.midY;
                        const midY = panY + midYc * zoom;
                        controlDot.setAttribute('cy', midY);
                    } else {
                        controlDot.setAttribute('cy', y1);
                    }
                    controlDot.setAttribute('r', '6');
                    controlDot.setAttribute('fill', '#5b9dd9');
                    controlDot.setAttribute('stroke', '#fff');
                    controlDot.setAttribute('stroke-width', '2');
                    controlDot.classList.add('connection-control-dot');
                    controlDot.style.cursor = 'move';
                    group.appendChild(controlDot);

                    this.svg.appendChild(group);
                });
            });
        });
    }

    // Temporary connection drawing during drag from a dot
    showTempFromDot(startDotEl) {
        const rect = this.canvas.getBoundingClientRect();
        const b = startDotEl.getBoundingClientRect();
        const panX = this.viewport ? this.viewport.panX : 0;
        const panY = this.viewport ? this.viewport.panY : 0;
        const zoom = this.viewport ? this.viewport.zoom : 1;
        // start in screen-relative
        const xs = b.left - rect.left + b.width / 2;
        const ys = b.top - rect.top + b.height / 2;
        // store canvas-space start
        this._tempStartCanvas = {
            x: (xs - panX) / zoom,
            y: (ys - panY) / zoom,
        };
        this._ensureTemp();
        const xd = panX + this._tempStartCanvas.x * zoom;
        const yd = panY + this._tempStartCanvas.y * zoom;
        this._tempPath.setAttribute('d', `M ${xd} ${yd} L ${xd} ${yd}`);
    }

    updateTempTo(clientX, clientY) {
        if (!this._tempPath || !this._tempStartCanvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const panX = this.viewport ? this.viewport.panX : 0;
        const panY = this.viewport ? this.viewport.panY : 0;
        const zoom = this.viewport ? this.viewport.zoom : 1;
        // end in screen-relative
        const xr = clientX - rect.left;
        const yr = clientY - rect.top;
        // convert to canvas coords
        const x2c = (xr - panX) / zoom;
        const y2c = (yr - panY) / zoom;
        let midXc = (this._tempStartCanvas.x + x2c) / 2;
        if (this.grid) midXc = this.grid.snap(midXc);
        // convert back to screen-relative for drawing
        const x1 = panX + this._tempStartCanvas.x * zoom;
        const y1 = panY + this._tempStartCanvas.y * zoom;
        const x2 = panX + x2c * zoom;
        const y2 = panY + y2c * zoom;
        const midX = panX + midXc * zoom;
        this._tempPath.setAttribute('d', `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
    }

    hideTemp() {
        if (this._tempPath) {
            this._tempPath.remove();
            this._tempPath = null;
            this._tempStartCanvas = null;
        }
    }

    _ensureTemp() {
        if (!this._tempPath) {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('stroke', '#5b9dd9');
            p.setAttribute('stroke-width', '2');
            p.setAttribute('fill', 'none');
            p.setAttribute('stroke-dasharray', '5,5');
            this.svg.appendChild(p);
            this._tempPath = p;
        }
    }
}
