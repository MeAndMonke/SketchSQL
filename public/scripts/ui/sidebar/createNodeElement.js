import { getColorForNode } from '../../../config/colors.js';
import { indexIcon } from '../../../config/icons.js';

function setupNodeDragEvents(nodeDiv, nodeId, sidebar) {
    // drag handle
    const dragHandle = nodeDiv.querySelector('.node-drag-handle');
    if (!dragHandle) return;

    // drag events
    dragHandle.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        nodeDiv.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
    });

    // end drag
    dragHandle.addEventListener('dragend', (e) => {
        e.stopPropagation();
        nodeDiv.classList.remove('dragging');
    });

    // allow drag over
    nodeDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        
        const dragging = document.querySelector('.sidebarNode.dragging');
        if (!dragging || dragging === nodeDiv) return;

        // check if in same parent
        if (dragging.parentElement !== nodeDiv.parentElement) return;

        // choose to insert before or after
        const rect = nodeDiv.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        // insert based on mouse position
        if (e.clientY < midpoint) {
            nodeDiv.parentElement.insertBefore(dragging, nodeDiv);
        } else {
            nodeDiv.parentElement.insertBefore(dragging, nodeDiv.nextSibling);
        }
    });

    // drop event
    nodeDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // update the data model
        const parent = nodeDiv.parentElement;
        const allNodes = Array.from(parent.querySelectorAll('.sidebarNode'));
        
        // build new nodes array based on DOM order
        const oldNodes = sidebar.nodeManager.getNodes();
        const newNodes = [];
        
        // map in order
        allNodes.forEach(nodeEl => {
            const id = parseInt(nodeEl.dataset.nodeId);
            const node = oldNodes.find(n => n.id === id);
            if (node) {
                newNodes.push(node);
            }
        });
        
        // update all nodes in manager
        sidebar.nodeManager.setNodes(newNodes);
        
        // re render sidebar
        sidebar.render();
    });
}

function setupRowDragEvents(rowDiv, nodeId, sidebar) {
    // drag handle
    const dragHandle = rowDiv.querySelector('.drag-handle');
    if (!dragHandle) return;

    // drag events
    dragHandle.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        rowDiv.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
    });

    // end drag
    dragHandle.addEventListener('dragend', (e) => {
        e.stopPropagation();
        rowDiv.classList.remove('dragging');
    });

    // allow drag over
    rowDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        
        const dragging = document.querySelector('.sidebarRow.dragging');
        if (!dragging || dragging === rowDiv) return;

        // check if in same parent
        if (dragging.parentElement !== rowDiv.parentElement) return;

        // choose to insert before or after
        const rect = rowDiv.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (e.clientY < midpoint) {
            rowDiv.parentElement.insertBefore(dragging, rowDiv);
        } else {
            rowDiv.parentElement.insertBefore(dragging, rowDiv.nextSibling);
        }
    });

    // drop event
    rowDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // update the data model
        const parent = rowDiv.parentElement;
        const allRows = Array.from(parent.querySelectorAll('.sidebarRow'));
        
        // get the current node from nodeManager
        const node = sidebar.nodeManager.getNodes().find(n => n.id === nodeId);
        if (!node) return;
        
        // build new rows array based on DOM order
        const newRows = [];
        allRows.forEach(row => {
            const index = parseInt(row.dataset.rowIndex);
            if (!isNaN(index) && node.rows[index]) {
                newRows.push(node.rows[index]);
            }
        });
        
        // update node in manager
        sidebar.nodeManager.updateNode(nodeId, (n) => {
            n.rows = newRows;
            return n;
        });
        
        // re render sidebar
        sidebar.render();
    });
}

export function createNodeElement(sidebar, node) {
    // create main node div
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'sidebarNode';
    nodeDiv.dataset.nodeId = node.id;

    // create header button
    const button = document.createElement('button');
    button.className = 'flex-row nodeToggleListButton';

    // get color for node
    const color = getColorForNode(sidebar.nodeManager, node.id);

    // set inner HTML
    button.innerHTML = `<div class="node-drag-handle" draggable="true" title="Drag to reorder table"></div>
        <div class="nodeColorBar" style="background-color: ${color.bg};"></div>
        <h2 class="nodeName">${node.name}</h2>
        <button class="editNodeName" title="Edit Name"><img src="../svg/edit.svg" alt=""></button>
        <button class="nodeOptionsButton" title="Options"><img src="../svg/option.svg" alt=""></button>`;

    // create node list
    const nodeList = document.createElement('div');
    nodeList.className = 'flex-column nodeList';
    nodeList.style.display = 'none';

    // add rows
    node.rows.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex-row sidebarRow';
        rowDiv.dataset.rowIndex = index;
        const nullableClass = row.nullable ? ' active' : '';
        const indexType = row.indexType || 'None';
        const indexButtonContent = indexIcon(indexType);

        rowDiv.innerHTML = `
                <div class="drag-handle" draggable="true" title="Drag to reorder"></div>
                <div class="rowColorBar"></div>
                <h4 class="rowName">${row.name}</h4>
                <h4 class="rowType">${row.type}</h4>
                <div class="flex-row rowOptions">
                    <button class="optionButton nullableButton${nullableClass}" title="Nullable">N</button>
                    <button class="optionButton indexTypeButton" title="Index Type: ${indexType}">${indexButtonContent}</button>
                    <button class="optionButton foreignKeyButton" title="Foreign Key">→</button>
                    <button class="optionButton rowOptionsButton" title="Options"><img src="../svg/option.svg" alt=""></button>
                </div>
            `;
        
        // Setup drag events
        setupRowDragEvents(rowDiv, node.id, sidebar);
        
        nodeList.appendChild(rowDiv);
    });

    // add "add row" button
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'addRow';
    addRowBtn.textContent = '+';
    addRowBtn.dataset.nodeId = node.id;
    nodeList.appendChild(addRowBtn);

    // assemble node element
    nodeDiv.appendChild(button);
    nodeDiv.appendChild(nodeList);
    
    // setup drag events for the node
    setupNodeDragEvents(nodeDiv, node.id, sidebar);
    
    return nodeDiv;
}
