export function rememberExpanded(sidebar) {
    sidebar.expandedNodes.clear();
    sidebar.sidebarElement.querySelectorAll('.nodeList').forEach(list => {
        if (list.style.display !== 'none') {
            const nodeId = parseInt(list.parentElement.dataset.nodeId, 10);
            sidebar.expandedNodes.add(nodeId);
        }
    });
}
