export class PopupMenu {
    constructor() {
        this.el = null;
    }

    // sidebar popup menu
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

        // position and add to element
        document.body.appendChild(menu);
        menu.style.left = pageX + 8 + 'px';
        menu.style.top = pageY + 8 + 'px';

        // hide on outside click
        const onOutside = (e) => {
            if (!menu.contains(e.target)) this.hide();
        };
        
        // avoid immediate trigger
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
