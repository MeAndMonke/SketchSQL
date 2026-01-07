import { ConnectionLayer } from './connectionLayer.js';
import { Viewport } from './viewport.js';
import { NodeLayer } from './nodeLayer.js';
import { InteractionController } from './interactionController.js';
import { ConnectionModel } from './connectionModel.js';
import { Grid } from './grid.js';

export class Canvas {
    constructor(canvasElement, nodeManager) {
        this.canvas = canvasElement;
        this.nodeManager = nodeManager;
        // Moved interaction state to InteractionController
        this._lastNodesJson = '';
        this._lastViewport = '';
        this._dirty = true;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.startRenderLoop();
    }

    setupCanvas() {
        this.canvas.style.position = 'relative';
        this.canvas.style.overflow = 'hidden';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Create SVG for connection lines
        if (!this.canvas.querySelector('#connectionSvg')) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'connectionSvg';
            // Styling is controlled via CSS (#connectionSvg)
            this.canvas.appendChild(svg);
            this.connectionSvg = svg;
        } else {
            this.connectionSvg = this.canvas.querySelector('#connectionSvg');
            // Ensure CSS controls z-index and pointer-events
            this.connectionSvg.style.zIndex = '';
            this.connectionSvg.style.pointerEvents = '';
        }
        
        // Create a transform container for zoom/pan
        if (!this.canvas.querySelector('.canvas-transform-container')) {
            const container = document.createElement('div');
            container.className = 'canvas-transform-container';
            container.style.position = 'absolute';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.transformOrigin = '0 0';
            container.style.zIndex = '1';
            this.canvas.appendChild(container);
            this.transformContainer = container;
        } else {
            this.transformContainer = this.canvas.querySelector('.canvas-transform-container');
            this.transformContainer.style.zIndex = '1';
        }

        // Initialize modules
        this.viewport = new Viewport(this.canvas, this.transformContainer);
        this.grid = new Grid(20);
        this.nodes = new NodeLayer(this.transformContainer, this.nodeManager);
        this.connections = new ConnectionLayer(this.canvas, this.connectionSvg, this.nodeManager, this.grid, this.viewport);
        this.connectionModel = new ConnectionModel(this.nodeManager);
        this.controller = new InteractionController(
            this.canvas,
            this.nodeManager,
            this.viewport,
            this.nodes,
            this.connections,
            this.connectionModel,
            this.grid
        );
    }

    setupEventListeners() {
        // InteractionController wires all input events; keep only contextmenu prevention to be safe
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Mark dirty on viewport changes
        const markDirty = () => { this._dirty = true; };
        this.viewport.onChange = markDirty;
    }

    syncWithNodeManager() {
        this.nodes.sync();
        const nodes = this.nodeManager.getNodes();
        const nodesJson = JSON.stringify(nodes);
        const viewportState = `${this.viewport.panX},${this.viewport.panY},${this.viewport.zoom}`;

        const changed = nodesJson !== this._lastNodesJson || viewportState !== this._lastViewport;
        if (changed || this._dirty) {
            this.connections.drawConnections(nodes, this.nodes.getNodesMap());
            this._lastNodesJson = nodesJson;
            this._lastViewport = viewportState;
            this._dirty = false;
        }
    }

    startRenderLoop() {
        const tick = () => {
            this.syncWithNodeManager();
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
}