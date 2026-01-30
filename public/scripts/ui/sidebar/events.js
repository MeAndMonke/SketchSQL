import { showColumnAttributesModal } from './modal.js';
import { makeEditable } from './editable.js';

export function attachEventListeners(sidebar) {
    const { sidebarElement, nodeManager } = sidebar;

    // toggle node list
    sidebarElement.querySelectorAll('.nodeToggleListButton').forEach(button => {
        button.addEventListener('click', () => {
            const nodeList = button.nextElementSibling;
            const sidebarNode = button.closest('.sidebarNode');
            const isOpen = nodeList.style.display === 'block';
            
            nodeList.style.display = isOpen ? 'none' : 'block';
            
            if (isOpen) {
                sidebarNode.classList.remove('expanded');
            } else {
                sidebarNode.classList.add('expanded');
            }
        });
    });

    // add row button
    sidebarElement.querySelectorAll('.addRow').forEach(btn => {
        btn.addEventListener('click', () => {
            const nodeId = parseInt(btn.dataset.nodeId, 10);
            nodeManager.updateNode(nodeId, node => {
                node.rows.push({ name: 'newColumn', type: 'VARCHAR', nullable: false, indexType: 'None' });
                return node;
            });
            sidebar.render();
        });
    });

    // row options (show attributes modal)
    sidebarElement.querySelectorAll('.rowOptionsButton').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const row = btn.closest('.sidebarRow');
            const nodeId = parseInt(row.closest('.sidebarNode').dataset.nodeId, 10);
            const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);
            showColumnAttributesModal(sidebar, nodeId, rowIndex);
        });
    });

    // toggle nullable button
    sidebarElement.querySelectorAll('.nullableButton').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const row = btn.closest('.sidebarRow');
            const nodeId = parseInt(row.closest('.sidebarNode').dataset.nodeId, 10);
            const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);
            nodeManager.updateNode(nodeId, node => {
                node.rows[rowIndex].nullable = !node.rows[rowIndex].nullable;
                return node;
            });
            sidebar.render();
        });
    });

    // index type button
    sidebarElement.querySelectorAll('.indexTypeButton').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const row = btn.closest('.sidebarRow');
            const nodeId = parseInt(row.closest('.sidebarNode').dataset.nodeId, 10);
            const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);

            // build menu
            const menu = document.createElement('div');
            menu.className = 'indexTypeMenu';
            menu.innerHTML = `
                    <button class="menuItem indexTypeOption" data-index-type="Primary key">Primary key</button>
                    <button class="menuItem indexTypeOption" data-index-type="Unique key">Unique key</button>
                    <button class="menuItem indexTypeOption" data-index-type="Index">Index</button>
                    <button class="menuItem indexTypeOption" data-index-type="None">None</button>
                `;

            menu.style.position = 'absolute';
            menu.style.top = btn.getBoundingClientRect().bottom + 'px';
            menu.style.left = btn.getBoundingClientRect().left + 'px';
            document.body.appendChild(menu);

            // handle selection
            menu.querySelectorAll('.indexTypeOption').forEach(option => {
                option.addEventListener('click', () => {
                    const selectedType = option.dataset.indexType;
                    nodeManager.updateNode(nodeId, node => {
                        node.rows[rowIndex].indexType = selectedType;
                        return node;
                    });
                    sidebar.render();
                    menu.remove();
                });
            });

            // close menu on outside click
            const closeMenu = () => {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            };
            setTimeout(() => document.addEventListener('click', closeMenu), 0);
        });
    });

    // foreign key button
    sidebarElement.querySelectorAll('.foreignKeyButton').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const row = btn.closest('.sidebarRow');
            const nodeId = parseInt(row.closest('.sidebarNode').dataset.nodeId, 10);
            const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);

            // build menu
            const menu = document.createElement('div');
            menu.className = 'indexTypeMenu';
            menu.style.maxHeight = '300px';
            menu.style.overflowY = 'auto';
            menu.style.minWidth = '200px';

            // populate menu with nodes and their columns
            const allNodes = nodeManager.getNodes();
            let menuHTML = '<button class="menuItem" data-target="none">None</button>';

            // loop through nodes and their rows
            allNodes.forEach(node => {
                menuHTML += `<div style="font-weight: bold; padding: 8px 10px; background-color: #555555; color: white; border-bottom: 1px solid #444;">${node.name}</div>`;
                if (node.rows) {
                    node.rows.forEach((row, rowIdx) => {
                        menuHTML += `<button class="menuItem" data-target="${node.id}:${rowIdx}" style="padding-left: 20px;">↳ ${row.name}</button>`;
                    });
                }
            });

            // set menu HTML
            menu.innerHTML = menuHTML;
            menu.style.position = 'absolute';
            menu.style.top = btn.getBoundingClientRect().bottom + 'px';
            menu.style.left = btn.getBoundingClientRect().left + 'px';
            menu.style.zIndex = '10000';
            document.body.appendChild(menu);

            // handle selection
            menu.querySelectorAll('.menuItem').forEach(option => {
                option.addEventListener('click', () => {
                    const targetValue = option.dataset.target === 'none' ? null : option.dataset.target;
                    nodeManager.updateNode(nodeId, node => {
                        node.rows[rowIndex].foreignKeyTo = targetValue;
                        return node;
                    });
                    sidebar.render();
                    menu.remove();
                });
            });

            // close menu on outside click
            const closeMenu = () => {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            };
            setTimeout(() => document.addEventListener('click', closeMenu), 0);
        });
    });

    // edit node name
    sidebarElement.querySelectorAll('.editNodeName').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            // prepare for editing
            const nodeName = btn.parentElement.querySelector('.nodeName');
            const currentText = nodeName.textContent;
            const nodeId = parseInt(btn.closest('.sidebarNode').dataset.nodeId, 10);

            // create input element
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = currentText;
            inputElement.className = 'nodeName';
            inputElement.style.padding = '5px';

            // replace and focus
            nodeName.replaceWith(inputElement);
            inputElement.focus();
            inputElement.select();

            // save function
            let saved = false;
            const saveEdit = () => {
                if (!saved && inputElement.parentElement) {
                    saved = true;
                    const newValue = inputElement.value || currentText;
                    nodeManager.updateNode(nodeId, node => ({ ...node, name: newValue }));
                    sidebar.render();
                }
            };

            // event listeners for saving
            inputElement.addEventListener('blur', saveEdit);
            inputElement.addEventListener('keypress', (evt) => {
                if (evt.key === 'Enter') {
                    inputElement.blur();
                }
            });
        });
    });

    // node options (delete node)
    sidebarElement.querySelectorAll('.nodeOptionsButton').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // show node options menu
            const sidebarNode = btn.closest('.sidebarNode');
            const nodeId = parseInt(sidebarNode.dataset.nodeId, 10);

            // build menu
            const menu = document.createElement('div');
            menu.className = 'indexTypeMenu';
            menu.innerHTML = `
                    <button class="menuItem deleteNodeOption">Delete node</button>
                `;

            menu.style.position = 'absolute';
            menu.style.top = btn.getBoundingClientRect().bottom + 'px';
            menu.style.left = btn.getBoundingClientRect().left + 'px';
            document.body.appendChild(menu);

            // handle delete
            menu.querySelector('.deleteNodeOption').addEventListener('click', () => {
                nodeManager.removeNode(nodeId);
                sidebar.render();
                menu.remove();
            });

            // close menu on outside click
            const closeMenu = () => {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            };
            setTimeout(() => document.addEventListener('click', closeMenu), 0);
        });
    });

    makeEditable(sidebar);
}
