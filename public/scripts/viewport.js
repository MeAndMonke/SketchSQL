export class Viewport {
    constructor(canvasEl, transformContainer) {
        this.canvas = canvasEl;
        this.container = transformContainer;
        this.zoom = 0.5;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.applyTransform();
    }

    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomSpeed = 0.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        const oldZoom = this.zoom;
        this.zoom += direction * zoomSpeed;
        this.zoom = Math.max(0.2, Math.min(3, this.zoom));
        const zoomChange = this.zoom / oldZoom;
        this.panX = mouseX - (mouseX - this.panX) * zoomChange;
        this.panY = mouseY - (mouseY - this.panY) * zoomChange;
        this.applyTransform();
    }

    beginPan(clientX, clientY) {
        this.isPanning = true;
        this.panStartX = clientX;
        this.panStartY = clientY;
    }

    panMove(clientX, clientY) {
        if (!this.isPanning) return;
        const deltaX = clientX - this.panStartX;
        const deltaY = clientY - this.panStartY;
        this.panX += deltaX;
        this.panY += deltaY;
        this.panStartX = clientX;
        this.panStartY = clientY;
        this.applyTransform();
    }

    endPan() {
        this.isPanning = false;
    }

    toCanvasCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left - this.panX) / this.zoom;
        const y = (clientY - rect.top - this.panY) / this.zoom;
        return { x, y };
    }

    applyTransform() {
        if (!this.container) return;
        this.container.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        this.container.style.transformOrigin = '0 0';
    }
}
