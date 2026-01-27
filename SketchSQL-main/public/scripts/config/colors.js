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
    { bg: '#ff9f1c', border: '#e68a17' },
    { bg: '#2a9d8f', border: '#23877e' },
    { bg: '#264653', border: '#1f3746' },
    { bg: '#e9c46a', border: '#d4b24a' },
    { bg: '#f4a261', border: '#e08b3a' },
    { bg: '#e76f51', border: '#d45a42' },
    { bg: '#d4a5a5', border: '#b98585' },
    { bg: '#90be6d', border: '#74a84f' },
    { bg: '#f9c74f', border: '#e0b43c' },
    { bg: '#f3722c', border: '#d95a1f' },
    { bg: '#43aa8b', border: '#32976f' }
];

export function getColorForNode(nodeManager, nodeId) {
    const allNodes = nodeManager.getNodes();
    const nodeIndex = allNodes.findIndex(n => n.id === nodeId);
    const colorIndex = nodeIndex >= 0 ? nodeIndex % colorPalette.length : 0;
    return colorPalette[colorIndex];
}
