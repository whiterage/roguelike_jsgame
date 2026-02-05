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

        this.screen.append(this.statusBox);
        this.screen.append(this.mapBox);
    }

    onInput(callback) {
        this.screen.key(['w', 's', 'a', 'd'], (ch, key) => {
            callback(key.name);
        });
    }

    draw(level, hero, levelCounter) {
        const statusUI = ` {bold}Level:{/bold} ${levelCounter}  |  {bold}HP:{/bold} {red-fg}${hero.hp}/${hero.maxHp}{/}  |  {bold}Str:{/bold} ${hero.strength}  |  {bold}Agi:{/bold} ${hero.agility}  |  {bold}Gold:{/bold} {yellow-fg}${hero.treasures || 0}{/}`;
        this.statusBox.setContent(statusUI);

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