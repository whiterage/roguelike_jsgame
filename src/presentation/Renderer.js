import blessed from 'blessed';

export default class Renderer {
    constructor() {
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'Rogue JS'
        });

        this.screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

        this.statusBox = blessed.box({
            top: 0,
            left: 'center',
            width: '100%',
            height: 1,
            tags: true,
            style: {
                fg: 'white',
                bg: 'blue'
            }
        });

        this.mapBox = blessed.box({
            top: 2,
            left: 'center',
            width: '100%',
            height: '100%',
            tags: true,
            border: {type: 'line'},
            style: {border: {fg: '#444444'}}
        });

        this.logBox = blessed.box({
            bottom: 0,
            left: 'center',
            width: '100%',
            height: '20%-1',
            tags: true,
            border: {type: 'line'},
            label: ' {bold}Combat Log{/bold} ',
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: ' ',
                bg: 'green'
            },
            mouse: true,
            style: {
                border: {fg: 'green'},
                fg: 'grey'
            }
        });

        this.alertBox = blessed.box({
            top: 'center',
            left: 'center',
            width: '50%',
            height: 5,
            align: 'center',
            valign: 'middle',
            hidden: true,
            tags: true,
            border: {type: 'line'},
            style: {
                fg: 'black',
                bg: 'magenta',
                border: {fg: 'cyan'},
                bold: true
            }
        });

        this.inventoryBox = blessed.box({
            top: 'center',
            left: 'center',
            width: 50,
            height: 20,
            hidden: true,
            label: ' {bold}Inventory (Press i to close){/bold} ',
            tags: true,
            border: {type: 'line'},
            style: {
                border: {fg: 'yellow'},
                bg: 'black',
                fg: 'white'
            },
            draggable: true,
            shadow: true
        });


        this.screen.append(this.statusBox);
        this.screen.append(this.mapBox);
        this.screen.append(this.logBox);
        this.screen.append(this.inventoryBox);
        this.screen.append(this.alertBox);

        this.isInventoryOpen = false;
    }

    showAlert(text, duration = 2000) {
        this.alertBox.setContent(`{center}${text}{/center}`);
        this.alertBox.show();
        this.alertBox.setFront();
        this.screen.render();

        setTimeout(() => {
            this.alertBox.hide();
            this.screen.render();
        }, duration);
    }

    onInput(callback) {
        this.screen.on('keypress', (ch, key) => {
            if (key && key.name) {
                callback(key.name);
            } else if (ch) {
                callback(ch);
            }
        });
    }

    toggleInventory(hero) {
        this.isInventoryOpen = !this.isInventoryOpen;

        if (this.isInventoryOpen) {
            this.inventoryBox.show();
            this._renderInventoryContent(hero);
            this.inventoryBox.setFront();
        } else {
            this.inventoryBox.hide();
        }
        this.screen.render();
        return this.isInventoryOpen;
    }

    _renderInventoryContent(hero) {
        if (hero.inventory.length === 0) {
            this.inventoryBox.setContent('\n  {red-fg}Your backpack is empty.{/red-fg}');
            return;
        }

        let content = '\n';
        hero.inventory.forEach((item, index) => {
            content += `  ${index + 1}. {${item.color}-fg}${item.symbol}{/} ${item.name}`;

            if (item.strength) content += ` {grey-fg}(Str +${item.strength}){/}`;
            if (item.agility) content += ` {grey-fg}(Agi +${item.agility}){/}`;
            if (item.healthBonus) content += ` {grey-fg}(HP +${item.healthBonus}){/}`;

            content += '\n';
        });

        content += '\n  {grey-fg}Press numbers (1-9) to use items.{/}';
        this.inventoryBox.setContent(content);
    }

    draw(level, hero, levelCounter, gameLog) {
        if (this.isInventoryOpen) return;

        const statusUI = ` {bold}Level:{/bold} ${levelCounter}  |  {bold}HP:{/bold} {red-fg}${hero.hp}/${hero.maxHp}{/}  |  {bold}Str:{/bold} ${hero.strength}  |  {bold}Agi:{/bold} ${hero.agility}  |  {bold}Gold:{/bold} {yellow-fg}${hero.treasures || 0}{/}`;
        this.statusBox.setContent(statusUI);

        const logContent = (gameLog || []).join('\n');
        this.logBox.setContent(logContent);
        this.logBox.setScrollPerc(100);

        let content = '';

        this.mapBox.width = level.width + 2;
        this.mapBox.height = level.height + 2;

        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {

                // игрок
                if (x === hero.x && y === hero.y) {
                    content += '{cyan-fg}{bold}⚡{/bold}{/cyan-fg}';
                    continue;
                }

                // враги
                const monster = level.monsters.find(m => m.x === x && m.y === y);
                if (monster) {
                    content += `{${monster.color}-fg}${monster.symbol}{/${monster.color}-fg}`;
                    continue;
                }

                // предметы
                const item = level.items && level.items.find(i => i.x === x && i.y === y);
                if (item) {
                    content += `{${item.color}-fg}${item.symbol}{/${item.color}-fg}`;
                    continue;
                }

                // выход
                if (x === level.stairsDown.x && y === level.stairsDown.y) {
                    content += '{magenta-fg}◎{/magenta-fg}';
                    continue;
                }

                // карта
                const tile = level.getTile(x, y);
                if (tile === 'wall') {
                    content += ' ';
                } else if (tile === 'floor') {
                    content += '{blue-fg}·{/blue-fg}';
                } else {
                    content += ' ';
                }

            }
            content += '\n';
        }
        this.mapBox.setContent(content);
        this.screen.render();
    }

    setTitle(text) {
        this.screen.title = text;
    }
}