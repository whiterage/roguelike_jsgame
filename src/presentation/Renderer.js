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
            top: 1,
            left: 'center',
            width: '100%',
            height: '100%-4',
            tags: true,
            style: {
                bg: 'black'
            }
        });

        this.logBox = blessed.box({
            bottom: 0,
            left: 'center',
            width: '100%',
            height: 4,
            tags: true,
            border: {type: 'line'},
            label: ' {bold}Log{/bold} ',
            style: {
                border: {fg: '#444444'},
                fg: 'grey'
            }
        });

        this.modalBox = blessed.box({
            top: 'center',
            left: 'center',
            width: 50,
            height: 14,
            hidden: true,
            tags: true,
            border: {type: 'line'},
            style: {
                border: {fg: 'yellow'},
                bg: 'black',
                fg: 'white'
            },
            shadow: true
        });

        this.screen.append(this.statusBox);
        this.screen.append(this.mapBox);
        this.screen.append(this.logBox);
        this.screen.append(this.modalBox);
    }

    onInput(callback) {
        this.screen.on('keypress', (ch, key) => {
            if (key && key.name) callback(key.name);
            else if (ch) callback(ch);
        });
    }

    draw(game) {
        const {level, hero, levelCounter, log, fog, inputMode, itemSelectionType} = game;

        const wpn = hero.weapon ? hero.weapon.name : 'Fists';
        const dmg = hero.attackDamage;
        const statusUI = ` Lvl: ${levelCounter} | HP: ${hero.hp}/${hero.maxHp} | Dmg: ${dmg} | Gold: ${game.stats.gold || hero.treasures} | {bold}[H]Wpn [J]Food [K]Pot [E]Scroll{/}`;
        this.statusBox.setContent(statusUI);

        this.logBox.setContent(log.slice(-3).join('\n'));

        let content = '';

        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {

                const isVisible = fog.visible[y][x];
                const isExplored = fog.explored[y][x];

                if (!isExplored) {
                    content += ' ';
                    continue;
                }

                const colorTag = isVisible ? '' : '{#444444-fg}';
                const closeTag = isVisible ? '' : '{/}';

                if (x === hero.x && y === hero.y) {
                    content += '{magenta-fg}Ω{/magenta-fg}';
                    continue;
                }

                const monster = level.monsters.find(m => m.x === x && m.y === y);
                if (monster && isVisible) {
                    if (monster.type === 'ghost' && !monster.isVisible) {
                        content += '{blue-fg}·{/blue-fg}';
                    } else {
                        content += `{${monster.color}-fg}${monster.symbol}{/${monster.color}-fg}`;
                    }
                    continue;
                }

                const item = level.items.find(i => i.x === x && i.y === y);
                if (item && isVisible) {
                    content += `{${item.color}-fg}${item.symbol}{/${item.color}-fg}`;
                    continue;
                }

                const tile = level.getTile(x, y);

                if (tile === 'wall') {
                    const symbol = this._getWallSymbol(level, x, y);
                    content += `${colorTag}${symbol}${closeTag}`;
                } else if (tile === 'floor') {
                    content += isVisible ? '{blue-fg}·{/blue-fg}' : `${colorTag}·${closeTag}`;
                } else if (tile === 'stairs') {
                    content += isVisible ? '{magenta-fg}≡{/magenta-fg}' : `${colorTag}≡${closeTag}`;
                } else {
                    content += ' ';
                }
            }
            content += '\n';
        }
        this.mapBox.setContent(content);

        if (inputMode === 'select_item') {
            this.modalBox.show();
            this._renderModal(hero, itemSelectionType);
            this.modalBox.setFront();
        } else {
            this.modalBox.hide();
        }

        this.screen.render();
    }

    _renderModal(hero, type) {
        const items = hero.inventory.filter(i => i.type === type);
        let content = `{center}{bold}Select ${type.toUpperCase()}{/bold}{/center}\n\n`;

        items.forEach((item, idx) => {
            content += ` ${idx + 1}. ${item.name}`;

            if (item.healthBonus) content += ` {green-fg}(+${item.healthBonus} HP){/}`;
            if (item.strength) content += ` {yellow-fg}(+${item.strength} Str){/}`;
            if (item.value && type === 'weapon') content += ` {red-fg}(+${item.value} Dmg){/}`;
            if (item.duration) content += ` {cyan-fg}(${item.duration} turns){/}`;

            content += '\n';
        });

        if (type === 'weapon') {
            content += `\n 0. Unequip Weapon`;
        } else {
            content += `\n 0. Cancel`;
        }

        this.modalBox.setContent(content);
    }

    _getWallSymbol(level, x, y) {
        const isWall = (tx, ty) => {
            if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height) return false;
            return level.getTile(tx, ty) === 'wall';
        };

        const n = isWall(x, y - 1);
        const s = isWall(x, y + 1);
        const w = isWall(x - 1, y);
        const e = isWall(x + 1, y);

        if (n && s && e && w) return '╬';
        if (n && s && e) return '╠';
        if (n && s && w) return '╣';
        if (n && e && w) return '╩';
        if (s && e && w) return '╦';

        if (s && e) return '╔';
        if (s && w) return '╗';
        if (n && e) return '╚';
        if (n && w) return '╝';

        if (n || s) return '║';
        if (e || w) return '═';

        return '#';
    }
}