export class PopupMenu {
    constructor() {
        this.el = null;
    }

    show(pageX, pageY, items) {
        this.hide();
        const menu = document.createElement('div');
        menu.className = 'connection-menu';
        items.forEach(it => {
            const btn = document.createElement('button');
            btn.className = it.className || '';
            btn.textContent = it.label;
            if (it.title) btn.title = it.title;
            btn.addEventListener('click', () => {
                if (it.onClick) it.onClick();
                this.hide();
            });
            menu.appendChild(btn);
        });
        document.body.appendChild(menu);
        menu.style.left = pageX + 8 + 'px';
        menu.style.top = pageY + 8 + 'px';

        const onOutside = (e) => {
            if (!menu.contains(e.target)) this.hide();
        };
        setTimeout(() => document.addEventListener('mousedown', onOutside, { once: true }), 0);
        this.el = menu;
        return menu;
    }

    hide() {
        if (this.el) {
            this.el.remove();
            this.el = null;
        }
    }
}
