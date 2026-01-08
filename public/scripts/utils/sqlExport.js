export function generateSQL(nodes) {
    let sql = '';
    // First, collect all foreign keys by target table
    const foreignKeysByTable = new Map();
    nodes.forEach(sourceNode => {
        sourceNode.rows.forEach((row) => {
            if (row.foreignKeyTo && Array.isArray(row.foreignKeyTo)) {
                row.foreignKeyTo.forEach(fk => {
                    const target = typeof fk === 'string' ? fk : fk.target;
                    const [targetNodeId, targetRowIndex] = target.split(':');
                    const targetNode = nodes.find(n => n.id === parseInt(targetNodeId, 10));
                    const targetRow = targetNode?.rows[parseInt(targetRowIndex, 10)];
                    if (targetRow) {
                        if (!foreignKeysByTable.has(targetNodeId)) {
                            foreignKeysByTable.set(targetNodeId, []);
                        }
                        foreignKeysByTable.get(targetNodeId).push({
                            columnName: targetRow.name,
                            refTable: sourceNode.name,
                            refColumn: row.name
                        });
                    }
                });
            }
        });
    });

    nodes.forEach(node => {
        sql += `CREATE TABLE ${node.name} (\n`;
        const lines = [];
        node.rows.forEach((row) => {
            let line = `  ${row.name} ${row.type}`;
            if (row.unsigned) line += ' UNSIGNED';
            if (!row.nullable) line += ' NOT NULL';
            if (row.autoIncrement) line += ' AUTO_INCREMENT';
            if (row.defaultValue !== undefined && row.defaultValue !== '') {
                line += ` DEFAULT ${row.defaultValue}`;
            }
            if (row.comment) {
                line += ` COMMENT '${row.comment.replace(/'/g, "''")}'`;
            }
            if (row.indexType === 'Primary key') {
                line += ' PRIMARY KEY';
            } else if (row.indexType === 'Unique key') {
                line += ' UNIQUE';
            } else if (row.indexType === 'Index') {
                line += ' INDEX';
            }
            lines.push(line);
        });

        sql += lines.join(',\n');
        const fks = foreignKeysByTable.get(String(node.id));
        if (fks && fks.length > 0) {
            fks.forEach(fk => {
                sql += ',\n';
                sql += `  FOREIGN KEY (${fk.columnName}) REFERENCES ${fk.refTable}(${fk.refColumn})`;
            });
        }
        sql += '\n);\n\n';
    });
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
