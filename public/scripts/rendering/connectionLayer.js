export class ConnectionLayer {
    constructor(canvasEl, svgEl, nodeManager, grid = null, viewport = null) {
        this.canvas = canvasEl;
        this.svg = svgEl;
        this.nodeManager = nodeManager;
        this.grid = grid;
        this.viewport = viewport;
        this.onClick = null;
        this._tempPath = null;

        // delegate click events
        if (!this._delegated) {
            this.svg.addEventListener('click', (evt) => {
                // onclick to detect which connection was clicked
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
                    rel: g.dataset.rel || '1:1'
                };
                this.onClick(evt, ref);
            }, true);
            this._delegated = true;
        }
    }

    // clear all connections
    clear() {
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    }

    // resize SVG to match canvas size
    resizeToCanvas() {
        this.svg.setAttribute('width', this.canvas.offsetWidth);
        this.svg.setAttribute('height', this.canvas.offsetHeight);
    }

    drawConnections(nodes, canvasNodes) {
        // draw all connections between nodes
        this.clear();
        this.resizeToCanvas();
        const panX = this.viewport ? this.viewport.panX : 0;
        const panY = this.viewport ? this.viewport.panY : 0;
        const zoom = this.viewport ? this.viewport.zoom : 1;

        // iterate over all nodes and their rows
        nodes.forEach(sourceNode => {
            if (!sourceNode.rows) return;
            sourceNode.rows.forEach((row, rowIndex) => {
                if (!row.foreignKeyTo) return;

                // normalize to array
                const raw = Array.isArray(row.foreignKeyTo) ? row.foreignKeyTo : [row.foreignKeyTo];
                const connections = raw.map((entry) => {
                    if (entry && typeof entry === 'object') {
                        return { target: entry.target ?? entry, rel: entry.rel ?? '1:1', midX: entry.midX, midY: entry.midY };
                    }
                    return { target: entry, rel: '1:1' };
                });

                // draw each connection
                connections.forEach((conn, connIndex) => {
                    // determine target node and row
                    let targetNodeId, targetRowIndex;
                    if (typeof conn.target === 'string' && conn.target.includes(':')) {
                        [targetNodeId, targetRowIndex] = conn.target.split(':');
                        targetRowIndex = parseInt(targetRowIndex, 10);
                    } else {
                        targetNodeId = conn.target;
                        targetRowIndex = 0;
                    }

                    // find target node
                    const targetNode = nodes.find(n => n.id === parseInt(targetNodeId, 10));
                    if (!targetNode) return;

                    // get elements and their bounds
                    const sourceElement = canvasNodes.get(sourceNode.id)?.element;
                    const targetElement = canvasNodes.get(targetNode.id)?.element;
                    if (!sourceElement || !targetElement) return;

                    // calculate positions
                    const sourceBounds = sourceElement.getBoundingClientRect();
                    const targetBounds = targetElement.getBoundingClientRect();
                    const canvasBounds = this.canvas.getBoundingClientRect();

                    // row positions
                    const sourceRows = sourceElement.querySelectorAll('.canvas-node-row');
                    const sourceRowElement = sourceRows[rowIndex];
                    const sourceRowBounds = sourceRowElement?.getBoundingClientRect();
                    const sourceRowY = sourceRowBounds ? sourceRowBounds.top - canvasBounds.top + sourceRowBounds.height / 2 : sourceBounds.top - canvasBounds.top + 50;

                    // target row positions
                    const targetRows = targetElement.querySelectorAll('.canvas-node-row');
                    const targetRowElement = targetRows[targetRowIndex];
                    const targetRowBounds = targetRowElement?.getBoundingClientRect();
                    const targetRowY = targetRowBounds ? targetRowBounds.top - canvasBounds.top + targetRowBounds.height / 2 : targetBounds.top - canvasBounds.top + 50;

                    // screen relative coordinates
                    const x1r = sourceBounds.right - canvasBounds.left;
                    const y1r = sourceRowY;
                    const x2r = targetBounds.left - canvasBounds.left;
                    const y2r = targetRowY;

                    // convert to canvas space
                    let x1c = (x1r - panX) / zoom;
                    let y1c = (y1r - panY) / zoom;
                    let x2c = (x2r - panX) / zoom;
                    let y2c = (y2r - panY) / zoom;

                    // snap to grid
                    if (this.grid) {
                        x1c = this.grid.snap(x1c);
                        x2c = this.grid.snap(x2c);
                    }

                    // use custom midX if provided
                    let midXc;
                    if (conn.midX !== undefined) {
                        // safety check
                        if (conn.midX > 100) {
                            // old pixel format - use as-is
                            midXc = conn.midX;
                            
                        } else {
                            // new grid format - convert to pixels
                            midXc = this.grid ? conn.midX * this.grid.size : conn.midX;
                            
                        }
                    } else {
                        midXc = (x1c + x2c) / 2;
                        if (this.grid) midXc = this.grid.snap(midXc);
                        
                    }

                    // calc stubs
                    const stubSize = this.grid ? this.grid.size : 20;
                    const x1StubC = x1c + stubSize;
                    const x2StubC = x2c - stubSize;

                    // convert back to screen-relative for drawing
                    const x1 = panX + x1c * zoom;
                    const y1 = panY + y1c * zoom;
                    const x2 = panX + x2c * zoom;
                    const y2 = panY + y2c * zoom;
                    const midX = panX + midXc * zoom;
                    const x1Stub = panX + x1StubC * zoom;
                    const x2Stub = panX + x2StubC * zoom;

                    // create path
                    let d;
                    if (conn.midY !== undefined) {
                        // safety check: if value is > 100, it's likely pixel data (old format)
                        let midYc;
                        if (conn.midY > 100) {
                            // old pixel format - use as-is
                            midYc = conn.midY;
                        } else {
                            // new grid format - convert to pixels
                            midYc = this.grid ? conn.midY * this.grid.size : conn.midY;
                        }
                        const midY = panY + midYc * zoom;
                        d = `M ${x1} ${y1} L ${x1Stub} ${y1} L ${midX} ${y1} L ${midX} ${midY} L ${x2Stub} ${midY} L ${x2Stub} ${y2} L ${x2} ${y2}`;
                    } else {
                        // default midY at y1 to y2 line
                        d = `M ${x1} ${y1} L ${x1Stub} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2Stub} ${y2} L ${x2} ${y2}`;
                    }

                    // create SVG elements
                    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

                    // hit area
                    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    hit.setAttribute('d', d);
                    hit.setAttribute('stroke', '#000');
                    hit.setAttribute('stroke-width', '20');
                    hit.setAttribute('fill', 'none');
                    hit.setAttribute('opacity', '0');
                    hit.setAttribute('pointer-events', 'stroke');

                    // visible line
                    const visible = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    visible.setAttribute('d', d);
                    visible.setAttribute('stroke', '#5b9dd9');
                    visible.setAttribute('stroke-width', '3');
                    visible.setAttribute('fill', 'none');
                    visible.setAttribute('stroke-linecap', 'round');
                    visible.style.cursor = 'pointer';

                    // data attributes for identification
                    group.dataset.sourceNodeId = String(sourceNode.id);
                    group.dataset.sourceRowIndex = String(rowIndex);
                    group.dataset.targetNodeId = String(targetNode.id);
                    group.dataset.targetRowIndex = String(targetRowIndex);
                    group.dataset.connIndex = String(connIndex);
                    group.dataset.rel = String(conn.rel || '1:1');

                    // append paths
                    group.appendChild(hit);
                    group.appendChild(visible);

                    // add relationship
                    const rel = conn.rel || '1:1';
                    this._addRelationshipNotation(group, rel, x1, y1, x2, y2, zoom);

                    // add control dot for mid-point
                    const controlDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    controlDot.setAttribute('cx', midX);
                    if (conn.midY !== undefined) {
                        // Safety check: if value is > 100, it's likely pixel data (old format)
                        let midYc;
                        if (conn.midY > 100) {
                            // Old pixel format
                            midYc = conn.midY;
                        } else {
                            // New grid format - convert to pixels
                            midYc = this.grid ? conn.midY * this.grid.size : conn.midY;
                        }
                        const midY = panY + midYc * zoom;
                        controlDot.setAttribute('cy', midY);
                    } else {
                        controlDot.setAttribute('cy', y1);
                    }
                    // control dot attributes
                    controlDot.setAttribute('r', '6');
                    controlDot.setAttribute('fill', '#2b5f91ff');
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

    // temporary connection line during creation
    showTempFromDot(startDotEl) {
        const rect = this.canvas.getBoundingClientRect();
        const b = startDotEl.getBoundingClientRect();
        const panX = this.viewport ? this.viewport.panX : 0;
        const panY = this.viewport ? this.viewport.panY : 0;
        const zoom = this.viewport ? this.viewport.zoom : 1;
        // start in screen relative
        const xs = b.left - rect.left + b.width / 2;
        const ys = b.top - rect.top + b.height / 2;
        // store canvas space start
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

        // calculate positions
        const rect = this.canvas.getBoundingClientRect();
        const panX = this.viewport ? this.viewport.panX : 0;
        const panY = this.viewport ? this.viewport.panY : 0;
        const zoom = this.viewport ? this.viewport.zoom : 1;

        // end in screen relative
        const xr = clientX - rect.left;
        const yr = clientY - rect.top;

        // convert to canvas coords
        const x2c = (xr - panX) / zoom;
        const y2c = (yr - panY) / zoom;
        let midXc = (this._tempStartCanvas.x + x2c) / 2;
        if (this.grid) midXc = this.grid.snap(midXc);

        // convert back to screen relative for drawing
        const x1 = panX + this._tempStartCanvas.x * zoom;
        const y1 = panY + this._tempStartCanvas.y * zoom;
        const x2 = panX + x2c * zoom;
        const y2 = panY + y2c * zoom;
        const midX = panX + midXc * zoom;

        // draw temp path
        this._tempPath.setAttribute('d', `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
    }

    hideTemp() {
        if (this._tempPath) {
            this._tempPath.remove();
            this._tempPath = null;
            this._tempStartCanvas = null;
        }
    }

    // ensure temp path exists
    _ensureTemp() {
        // create temp path if not exists
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

    // add relationship notation
    _addRelationshipNotation(group, rel, x1, y1, x2, y2, zoom) {
        const footSize = 5 * zoom;
        
        if (rel === '1:1') {
            // single line at both source and target
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', x1 - footSize);
            line1.setAttribute('y1', y1 - footSize);
            line1.setAttribute('x2', x1 - footSize);
            line1.setAttribute('y2', y1 + footSize);
            line1.setAttribute('stroke', '#5b9dd9');
            line1.setAttribute('stroke-width', '2');
            line1.setAttribute('pointer-events', 'none');
            group.appendChild(line1);
            
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', x2 + footSize);
            line2.setAttribute('y1', y2 - footSize);
            line2.setAttribute('x2', x2 + footSize);
            line2.setAttribute('y2', y2 + footSize);
            line2.setAttribute('stroke', '#5b9dd9');
            line2.setAttribute('stroke-width', '2');
            line2.setAttribute('pointer-events', 'none');
            group.appendChild(line2);
        } else if (rel === '1:N') {
            // at source (x1, y1), N (crow's foot) at target (x2, y2)
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', x1 - footSize);
            line1.setAttribute('y1', y1 - footSize);
            line1.setAttribute('x2', x1 - footSize);
            line1.setAttribute('y2', y1 + footSize);
            line1.setAttribute('stroke', '#5b9dd9');
            line1.setAttribute('stroke-width', '2');
            line1.setAttribute('pointer-events', 'none');
            group.appendChild(line1);
            
            // add crow's foot at target
            this._drawCrowsFoot(group, x2, y2, 'target', zoom);
        } else if (rel === 'N:1') {
            // at source (x1, y1), crow's foot at source, single line at target
            this._drawCrowsFoot(group, x1, y1, 'source', zoom);
            
            // single line at target
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', x2 + footSize);
            line2.setAttribute('y1', y2 - footSize);
            line2.setAttribute('x2', x2 + footSize);
            line2.setAttribute('y2', y2 + footSize);
            line2.setAttribute('stroke', '#5b9dd9');
            line2.setAttribute('stroke-width', '2');
            line2.setAttribute('pointer-events', 'none');
            group.appendChild(line2);
        }
    }

    _drawCrowsFoot(group, x, y, position, zoom) {
        const footSize = 5 * zoom;
        const offset = position === 'source' ? -footSize : footSize;
        
        // vertical line
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', x + offset);
        vLine.setAttribute('y1', y - footSize);
        vLine.setAttribute('x2', x + offset);
        vLine.setAttribute('y2', y + footSize);
        vLine.setAttribute('stroke', '#5b9dd9');
        vLine.setAttribute('stroke-width', '2');
        vLine.setAttribute('pointer-events', 'none');
        group.appendChild(vLine);
        
        // top diagonal
        const topDiag = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        topDiag.setAttribute('x1', x + offset);
        topDiag.setAttribute('y1', y - footSize);
        topDiag.setAttribute('x2', x);
        topDiag.setAttribute('y2', y);
        topDiag.setAttribute('stroke', '#5b9dd9');
        topDiag.setAttribute('stroke-width', '2');
        topDiag.setAttribute('pointer-events', 'none');
        group.appendChild(topDiag);
        
        // middle horizontal
        const midLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        midLine.setAttribute('x1', x + offset);
        midLine.setAttribute('y1', y);
        midLine.setAttribute('x2', x);
        midLine.setAttribute('y2', y);
        midLine.setAttribute('stroke', '#5b9dd9');
        midLine.setAttribute('stroke-width', '2');
        midLine.setAttribute('pointer-events', 'none');
        group.appendChild(midLine);
        
        // bottom diagonal
        const botDiag = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        botDiag.setAttribute('x1', x + offset);
        botDiag.setAttribute('y1', y + footSize);
        botDiag.setAttribute('x2', x);
        botDiag.setAttribute('y2', y);
        botDiag.setAttribute('stroke', '#5b9dd9');
        botDiag.setAttribute('stroke-width', '2');
        botDiag.setAttribute('pointer-events', 'none');
        group.appendChild(botDiag);
    }
}
