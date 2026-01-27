export function makeEditable(sidebar) {
    const { sidebarElement, typeOptions, nodeManager } = sidebar;
    sidebarElement.querySelectorAll('.rowName, .rowType').forEach(element => {
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

                typeOptions.forEach(option => {
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
                    nodeManager.updateNode(nodeId, node => {
                        if (isTypeField) {
                            node.rows[rowIndex].type = newValue;
                        } else {
                            node.rows[rowIndex].name = newValue;
                        }
                        return node;
                    });
                    sidebar.render();
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
