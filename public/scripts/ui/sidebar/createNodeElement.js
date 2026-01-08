import { getColorForNode } from '../../../config/colors.js';
import { indexIcon } from '../../../config/icons.js';

export function createNodeElement(sidebar, node) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'sidebarNode';
    nodeDiv.dataset.nodeId = node.id;

    const button = document.createElement('button');
    button.className = 'flex-row nodeToggleListButton';

    const color = getColorForNode(sidebar.nodeManager, node.id);

    button.innerHTML = `<div class="nodeColorBar" style="background-color: ${color.bg};"></div>
        <h2 class="nodeName">${node.name}</h2>
        <button class="editNodeName" title="Edit Name"><img src="../svg/edit.svg" alt=""></button>
        <button class="nodeOptionsButton" title="Options"><img src="../svg/option.svg" alt=""></button>`;

    const nodeList = document.createElement('div');
    nodeList.className = 'flex-column nodeList';
    nodeList.style.display = 'none';

    node.rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex-row sidebarRow';
        const nullableClass = row.nullable ? ' active' : '';
        const indexType = row.indexType || 'None';
        const indexButtonContent = indexIcon(indexType);

        rowDiv.innerHTML = `
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
        nodeList.appendChild(rowDiv);
    });

    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'addRow';
    addRowBtn.textContent = '+';
    addRowBtn.dataset.nodeId = node.id;
    nodeList.appendChild(addRowBtn);

    nodeDiv.appendChild(button);
    nodeDiv.appendChild(nodeList);
    return nodeDiv;
}
