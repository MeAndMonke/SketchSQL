export class Sidebar {
    constructor({ sidebarElement, nodeManager, typeOptions }) {
        this.sidebarElement = sidebarElement;
        this.nodeManager = nodeManager;
        this.typeOptions = typeOptions;
        this.expandedNodes = new Set();
    }

    render() {
        this.#rememberExpanded();
        const nodes = this.nodeManager.getNodes();

        this.sidebarElement.innerHTML = '';
        nodes.forEach(node => {
            const nodeEl = this.#createNodeElement(node);
            this.sidebarElement.appendChild(nodeEl);
        });

        // restore expansion
        this.sidebarElement.querySelectorAll('.nodeList').forEach(list => {
            const nodeId = parseInt(list.parentElement.dataset.nodeId, 10);
            if (this.expandedNodes.has(nodeId)) {
                list.style.display = 'block';
            }
        });

        this.#attachEventListeners();
        this.nodeManager.setNodes(this.nodeManager.getNodes());
    }

    #rememberExpanded() {
        this.expandedNodes.clear();
        this.sidebarElement.querySelectorAll('.nodeList').forEach(list => {
            if (list.style.display !== 'none') {
                const nodeId = parseInt(list.parentElement.dataset.nodeId, 10);
                this.expandedNodes.add(nodeId);
            }
        });
    }

    #createNodeElement(node) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'sidebarNode';
        nodeDiv.dataset.nodeId = node.id;

        const button = document.createElement('button');
        button.className = 'flex-row nodeToggleListButton';
        button.innerHTML = `<div class="nodeColorBar"></div>
        <h2 class="nodeName">${node.name}</h2>
        <button class="editNodeName" title="Edit Name"><img src="./svg/edit.svg" alt=""></button>
        <button class="nodeOptionsButton" title="Options"><img src="./svg/option.svg" alt=""></button>`;

        const nodeList = document.createElement('div');
        nodeList.className = 'flex-column nodeList';
        nodeList.style.display = 'none';

        node.rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'flex-row sidebarRow';
            const nullableClass = row.nullable ? ' active' : '';
            const indexType = row.indexType || 'None';

            const indexButtonContent = this.#indexIcon(indexType);

            rowDiv.innerHTML = `
                <div class="rowColorBar"></div>
                <h4 class="rowName">${row.name}</h4>
                <h4 class="rowType">${row.type}</h4>
                <div class="flex-row rowOptions">
                    <button class="optionButton nullableButton${nullableClass}" title="Nullable">N</button>
                    <button class="optionButton indexTypeButton" title="Index Type: ${indexType}">${indexButtonContent}</button>
                    <button class="optionButton foreignKeyButton" title="Foreign Key">→</button>
                    <button class="optionButton rowOptionsButton" title="Options"><img src="./svg/option.svg" alt=""></button>
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

    #indexIcon(indexType) {
        if (indexType === 'Primary key') return '<img src="./svg/key.svg" alt="">';
        if (indexType === 'Unique key') return '<img src="./svg/unique.svg" alt="">';
        if (indexType === 'Index') return '<img src="./svg/index.svg" alt="">';
        return '';
    }

    #attachEventListeners() {
        // toggle node list
        this.sidebarElement.querySelectorAll('.nodeToggleListButton').forEach(button => {
            button.addEventListener('click', () => {
                const nodeList = button.nextElementSibling;
                nodeList.style.display = nodeList.style.display === 'none' ? 'block' : 'none';
            });
        });

        // add row button
        this.sidebarElement.querySelectorAll('.addRow').forEach(btn => {
            btn.addEventListener('click', () => {
                const nodeId = parseInt(btn.dataset.nodeId, 10);
                this.nodeManager.updateNode(nodeId, node => {
                    node.rows.push({ name: 'newColumn', type: 'VARCHAR', nullable: false, indexType: 'None' });
                    return node;
                });
                this.render();
            });
        });

        // row options (delete row)
        this.sidebarElement.querySelectorAll('.rowOptionsButton').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.sidebarRow');
                const nodeId = parseInt(row.closest('.sidebarNode').dataset.nodeId, 10);
                const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);

                const menu = document.createElement('div');
                menu.className = 'indexTypeMenu';
                menu.innerHTML = `
                    <button class="menuItem deleteRowOption">Delete row</button>
                `;

                menu.style.position = 'absolute';
                menu.style.top = btn.getBoundingClientRect().bottom + 'px';
                menu.style.left = btn.getBoundingClientRect().left + 'px';
                document.body.appendChild(menu);

                menu.querySelector('.deleteRowOption').addEventListener('click', () => {
                    this.nodeManager.updateNode(nodeId, node => {
                        node.rows.splice(rowIndex, 1);
                        return node;
                    });
                    this.render();
                    menu.remove();
                });

                const closeMenu = () => {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                };
                setTimeout(() => document.addEventListener('click', closeMenu), 0);
            });
        });

        // toggle nullable button
        this.sidebarElement.querySelectorAll('.nullableButton').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.sidebarRow');
                const nodeId = parseInt(row.closest('.sidebarNode').dataset.nodeId, 10);
                const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);
                this.nodeManager.updateNode(nodeId, node => {
                    node.rows[rowIndex].nullable = !node.rows[rowIndex].nullable;
                    return node;
                });
                this.render();
            });
        });

        // index type button
        this.sidebarElement.querySelectorAll('.indexTypeButton').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.sidebarRow');
                const nodeId = parseInt(row.closest('.sidebarNode').dataset.nodeId, 10);
                const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);

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

                menu.querySelectorAll('.indexTypeOption').forEach(option => {
                    option.addEventListener('click', () => {
                        const selectedType = option.dataset.indexType;
                        this.nodeManager.updateNode(nodeId, node => {
                            node.rows[rowIndex].indexType = selectedType;
                            return node;
                        });
                        this.render();
                        menu.remove();
                    });
                });

                const closeMenu = () => {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                };
                setTimeout(() => document.addEventListener('click', closeMenu), 0);
            });
        });

        // foreign key button
        this.sidebarElement.querySelectorAll('.foreignKeyButton').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.sidebarRow');
                const nodeId = parseInt(row.closest('.sidebarNode').dataset.nodeId, 10);
                const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);
                const currentNode = this.nodeManager.getNodes().find(n => n.id === nodeId);
                const currentRow = currentNode.rows[rowIndex];

                const menu = document.createElement('div');
                menu.className = 'indexTypeMenu';
                menu.style.maxHeight = '300px';
                menu.style.overflowY = 'auto';
                menu.style.minWidth = '200px';
                
                const allNodes = this.nodeManager.getNodes();
                let menuHTML = '<button class="menuItem" data-target="none">None</button>';
                
                allNodes.forEach(node => {
                    menuHTML += `<div style="font-weight: bold; padding: 8px 10px; background-color: #555555; color: white; border-bottom: 1px solid #444;">${node.name}</div>`;
                    if (node.rows) {
                        node.rows.forEach((row, rowIdx) => {
                            menuHTML += `<button class="menuItem" data-target="${node.id}:${rowIdx}" style="padding-left: 20px;">↳ ${row.name}</button>`;
                        });
                    }
                });
                
                menu.innerHTML = menuHTML;
                menu.style.position = 'absolute';
                menu.style.top = btn.getBoundingClientRect().bottom + 'px';
                menu.style.left = btn.getBoundingClientRect().left + 'px';
                menu.style.zIndex = '10000';
                document.body.appendChild(menu);

                menu.querySelectorAll('.menuItem').forEach(option => {
                    option.addEventListener('click', () => {
                        const targetValue = option.dataset.target === 'none' ? null : option.dataset.target;
                        this.nodeManager.updateNode(nodeId, node => {
                            node.rows[rowIndex].foreignKeyTo = targetValue;
                            return node;
                        });
                        this.render();
                        menu.remove();
                    });
                });

                const closeMenu = () => {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                };
                setTimeout(() => document.addEventListener('click', closeMenu), 0);
            });
        });

        // edit node name
        this.sidebarElement.querySelectorAll('.editNodeName').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const nodeName = btn.parentElement.querySelector('.nodeName');
                const currentText = nodeName.textContent;
                const nodeId = parseInt(btn.closest('.sidebarNode').dataset.nodeId, 10);

                const inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentText;
                inputElement.className = 'nodeName';
                inputElement.style.padding = '5px';

                nodeName.replaceWith(inputElement);
                inputElement.focus();
                inputElement.select();

                let saved = false;
                const saveEdit = () => {
                    if (!saved && inputElement.parentElement) {
                        saved = true;
                        const newValue = inputElement.value || currentText;
                        this.nodeManager.updateNode(nodeId, node => ({ ...node, name: newValue }));
                        this.render();
                    }
                };

                inputElement.addEventListener('blur', saveEdit);
                inputElement.addEventListener('keypress', (evt) => {
                    if (evt.key === 'Enter') {
                        inputElement.blur();
                    }
                });
            });
        });

        // node options (delete node)
        this.sidebarElement.querySelectorAll('.nodeOptionsButton').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sidebarNode = btn.closest('.sidebarNode');
                const nodeId = parseInt(sidebarNode.dataset.nodeId, 10);

                const menu = document.createElement('div');
                menu.className = 'indexTypeMenu';
                menu.innerHTML = `
                    <button class="menuItem deleteNodeOption">Delete node</button>
                `;

                menu.style.position = 'absolute';
                menu.style.top = btn.getBoundingClientRect().bottom + 'px';
                menu.style.left = btn.getBoundingClientRect().left + 'px';
                document.body.appendChild(menu);

                menu.querySelector('.deleteNodeOption').addEventListener('click', () => {
                    this.nodeManager.removeNode(nodeId);
                    this.render();
                    menu.remove();
                });

                const closeMenu = () => {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                };
                setTimeout(() => document.addEventListener('click', closeMenu), 0);
            });
        });

        this.#makeEditable();
    }

    #makeEditable() {
        this.sidebarElement.querySelectorAll('.rowName, .rowType').forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                if (element.tagName !== 'H4') return;

                const currentText = element.textContent;
                const isTypeField = element.classList.contains('rowType');
                const row = element.closest('.sidebarRow');
                const nodeId = parseInt(element.closest('.sidebarNode').dataset.nodeId, 10);
                const rowIndex = Array.from(row.parentElement.querySelectorAll('.sidebarRow')).indexOf(row);

                const originalElement = element;
                let inputElement;

                if (isTypeField) {
                    inputElement = document.createElement('select');
                    inputElement.className = originalElement.className;
                    inputElement.style.padding = '5px';

                    this.typeOptions.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option;
                        opt.textContent = option;
                        if (option === currentText) opt.selected = true;
                        inputElement.appendChild(opt);
                    });
                } else {
                    inputElement = document.createElement('input');
                    inputElement.type = 'text';
                    inputElement.value = currentText;
                    inputElement.className = originalElement.className;
                    inputElement.style.padding = '5px';
                }

                originalElement.replaceWith(inputElement);
                inputElement.focus();

                let saved = false;
                if (!isTypeField) {
                    inputElement.select();
                } else {
                    inputElement.click();
                }

                const saveEdit = () => {
                    if (!saved && inputElement.parentElement) {
                        saved = true;
                        const newValue = inputElement.value || currentText;
                        this.nodeManager.updateNode(nodeId, node => {
                            if (isTypeField) {
                                node.rows[rowIndex].type = newValue;
                            } else {
                                node.rows[rowIndex].name = newValue;
                            }
                            return node;
                        });
                        this.render();
                    }
                };

                inputElement.addEventListener('blur', saveEdit);
                inputElement.addEventListener('change', saveEdit);
                if (!isTypeField) {
                    inputElement.addEventListener('keypress', (evt) => {
                        if (evt.key === 'Enter') {
                            inputElement.blur();
                        }
                    });
                }
            });
        });
    }
}