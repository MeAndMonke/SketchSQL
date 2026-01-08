export const colorPalette = [
    { bg: '#ff6b9d', border: '#ff5a8a' },
    { bg: '#4ecdc4', border: '#3ab8b0' },
    { bg: '#c5ac2cff', border: '#807019ff' },
    { bg: '#95e1d3', border: '#7dd9c1' },
    { bg: '#f38181', border: '#f06b5d' },
    { bg: '#aa96da', border: '#9375d9' },
    { bg: '#fcbad3', border: '#f799b8' },
    { bg: '#a8dadc', border: '#8fc7d0' },
    { bg: '#8cc779ff', border: '#5aa787ff' },
    { bg: '#e76f51', border: '#d45a42' },
];

export function getColorForNode(nodeManager, nodeId) {
    const allNodes = nodeManager.getNodes();
    const nodeIndex = allNodes.findIndex(n => n.id === nodeId);
    const colorIndex = nodeIndex >= 0 ? nodeIndex % colorPalette.length : 0;
    return colorPalette[colorIndex];
}
