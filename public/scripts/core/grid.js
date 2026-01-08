export class Grid {
    constructor(size = 20) {
        this.size = size;
    }
    snap(v) {
        return Math.round(v / this.size) * this.size;
    }
}
