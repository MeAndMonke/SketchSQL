
function collectForeignKeys(nodes) {
    const map = new Map();

    for (const sourceNode of nodes) {
        for (const row of sourceNode.rows) {
            if (!Array.isArray(row.foreignKeyTo)) continue;

            for (const fk of row.foreignKeyTo) {
                const target = typeof fk === 'string' ? fk : fk.target;
                const [targetNodeId, targetRowIndex] = target.split(':');

                const targetNode = nodes.find(n => n.id === Number(targetNodeId));
                const targetRow = targetNode?.rows[Number(targetRowIndex)];

                if (!targetRow) continue;

                if (!map.has(targetNodeId)) {
                    map.set(targetNodeId, []);
                }

                map.get(targetNodeId).push({
                    columnName: targetRow.name,
                    refTable: sourceNode.name,
                    refColumn: row.name
                });
            }
        }
    }

    return map;
}

function buildCreateTableSQL(node, foreignKeysByTable) {
    const lines = node.rows.map(buildRowSQL);
    const foreignKeys = foreignKeysByTable.get(String(node.id)) ?? [];

    let sql = `CREATE TABLE ${node.name} (\n`;
    sql += lines.join(',\n');

    for (const fk of foreignKeys) {
        sql += `,\n  FOREIGN KEY (${fk.columnName}) REFERENCES ${fk.refTable}(${fk.refColumn}) ON DELETE CASCADE`;
    }

    sql += '\n);\n\n';

    return sql;
}

function buildRowSQL(row) {
    let line = `  ${row.name} ${row.type}`;

    if (row.type === "VARCHAR") {
        line += `(255)`;
    }

    if (row.unsigned) line += ' UNSIGNED';
    if (!row.nullable) line += ' NOT NULL';
    if (row.autoIncrement) line += ' AUTO_INCREMENT';

    if (row.defaultValue !== undefined && row.defaultValue !== '') {
        line += ` DEFAULT ${row.defaultValue}`;
    }

    if (row.comment) {
        line += ` COMMENT '${row.comment.replace(/'/g, "''")}'`;
    }

    const indexMap = {
        'Primary key': ' PRIMARY KEY',
        'Unique key': ' UNIQUE',
        'Index': ' INDEX'
    };

    if (indexMap[row.indexType]) {
        line += indexMap[row.indexType];
    }

    return line;
}

export function generateSQL(nodes) {
    const foreignKeysByTable = collectForeignKeys(nodes);
    let sql = '';

    for (const node of nodes) {
        sql += buildCreateTableSQL(node, foreignKeysByTable);
    }

    return sql;
}

export function downloadSQL(sql, filename = 'schema.sql') {
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}
