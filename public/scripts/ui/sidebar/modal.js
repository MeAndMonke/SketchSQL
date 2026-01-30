export function showColumnAttributesModal(sidebar, nodeId, rowIndex) {
    // get node and row
    const node = sidebar.nodeManager.getNodes().find(n => n.id === nodeId);
    const row = node.rows[rowIndex];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'column-attributes-modal';
    modal.innerHTML = `
            <div class="modal-header">
                <h3>COLUMN ATTRIBUTES</h3>
                <button class="modal-close">✕</button>
            </div>
            <div class="modal-body">
                <label class="checkbox-label">
                    <input type="checkbox" id="autoIncrement" ${row.autoIncrement ? 'checked' : ''}>
                    <span>Auto increment</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="unsigned" ${row.unsigned ? 'checked' : ''}>
                    <span>Unsigned</span>
                </label>
                <div class="form-group">
                    <label>Default</label>
                    <input type="text" id="defaultValue" value="${row.defaultValue || ''}" placeholder="Default value">
                </div>
                <div class="form-group">
                    <label>Comment</label>
                    <textarea id="comment" placeholder="Optional description for this column">${row.comment || ''}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="delete-column-btn">🗑 Delete column</button>
            </div>
        `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // close modal function
    const closeModal = () => {
        overlay.remove();
    };

    // close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // close on close button click
    modal.querySelector('.modal-close').addEventListener('click', closeModal);

    // save changes function
    const saveAttribute = (property, value) => {
        sidebar.nodeManager.updateNode(nodeId, node => {
            node.rows[rowIndex][property] = value;
            return node;
        });
    };

    // event listeners for inputs
    modal.querySelector('#autoIncrement').addEventListener('change', (e) => {
        saveAttribute('autoIncrement', e.target.checked);
    });

    // unsigned checkbox
    modal.querySelector('#unsigned').addEventListener('change', (e) => {
        saveAttribute('unsigned', e.target.checked);
    });

    // default value input
    modal.querySelector('#defaultValue').addEventListener('blur', (e) => {
        saveAttribute('defaultValue', e.target.value);
    });

    // comment textarea
    modal.querySelector('#comment').addEventListener('blur', (e) => {
        saveAttribute('comment', e.target.value);
    });

    // delete column button
    modal.querySelector('.delete-column-btn').addEventListener('click', () => {
        sidebar.nodeManager.updateNode(nodeId, node => {
            node.rows.splice(rowIndex, 1);
            return node;
        });
        sidebar.render();
        closeModal();
    });
}
