export function indexIcon(indexType) {
    if (indexType === 'Primary key') return '<img src="../svg/key.svg" alt="">';
    if (indexType === 'Unique key') return '<img src="../svg/unique.svg" alt="">';
    if (indexType === 'Index') return '<img src="../svg/index.svg" alt="">';
    return '';
}
