import blessed from 'blessed';
import MapGenerator from "./domain/logic/MapGenerator.js";
import Character from "./domain/entities/Character.js";

const screen = blessed.screen({
    smartCSR: true,
    title: 'Rogue JS - Level 1'
});

screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});

const width = process.stdout.columns - 4;
const height = process.stdout.rows - 6;

const generator = new MapGenerator(width, height);
let level;
let levelCounter = 1;

const hero = new Character({
    maxHp: 100,
    strength: 20,
    agility: 20
});

function nextLevel() {
    level = generator.generate();
    hero.setPosition(level.startPoint.x, level.startPoint.y);
    screen.title = `Rogue JS - Level ${levelCounter}`;
}

nextLevel();

const statusBox = blessed.box({
    top: 0,
    left: 'center',
    width: '100%',
    height: 1,
    content: '',
    tags: true,
    style: {
        fg: 'white',
        bg: 'blue'
    }
});

screen.append(statusBox);

const mapBox = blessed.box({
    top: 2,
    left: 'center',
    width: level.width + 2,
    height: level.height + 2,
    content: 'Loading...',
    tags: true,
    border: {type: 'line'},
    style: {border: {fg: '#444444'}}
});

screen.append(mapBox);

screen.key(['w', 's', 'a', 'd'], function (ch, key) {
    const MOVES = {
        w: {x: 0, y: -1},
        s: {x: 0, y: 1},
        a: {x: -1, y: 0},
        d: {x: 1, y: 0}
    };

    const move = MOVES[key.name];
    if (!move) return;

    const newX = hero.x + move.x;
    const newY = hero.y + move.y;

    // стены
    const targetTile = level.getTile(newX, newY);

    if (targetTile !== 'wall') {
        hero.setPosition(newX, newY);

        if (newX === level.stairsDown.x && newY === level.stairsDown.y) {
            levelCounter++;
            nextLevel();
        }

        draw();
    }
});

function draw() {
    const statusUI = ` {bold}Level:{/bold} ${levelCounter}  |  {bold}HP:{/bold} {red-fg}${hero.hp}/${hero.maxHp}{/}  |  {bold}Str:{/bold} ${hero.strength}  |  {bold}Agi:{/bold} ${hero.agility}`;
    statusBox.setContent(statusUI);

    let content = '';

    const monsters = level.monsters;

    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {

            // игрок
            if (x === hero.x && y === hero.y) {
                content += '{cyan-fg}{bold}⚡{/bold}{/cyan-fg}';
                continue;
            }

            // враги
            const monster = monsters.find(m => m.x === x && m.y === y);
            if (monster) {
                content += `{${monster.color}-fg}${monster.symbol}{/${monster.color}-fg}`;
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
    mapBox.setContent(content);
    screen.render();
}

draw();