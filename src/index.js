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
const height = process.stdout.rows - 4;

const generator = new MapGenerator(width, height);
let level;

function nextLevel() {
    level = generator.generate();
    hero.setPosition(level.startPoint.x, level.startPoint.y);
    screen.title = `Rogue JS - Level ${levelCounter}`;
}

const hero = new Character({
    maxHp: 100,
    strength: 20,
    agility: 20
});

let levelCounter = 1;

nextLevel();

const mapBox = blessed.box({
    top: 'center',
    left: 'center',
    width: level.width + 2,
    height: level.height + 2,
    content: 'Loading...',
    tags: true,
    border: {type: 'line'}
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
    let content = '';
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {

            // игрок
            if (x === hero.x && y === hero.y) {
                content += '{cyan-fg}{bold}⚡{/bold}{/cyan-fg}';
            }
            // выход
            else if (x === level.stairsDown.x && y === level.stairsDown.y) {
                content += '{magenta-fg}◎{/magenta-fg}';
            }
            // карта
            else {
                const tile = level.getTile(x, y);
                if (tile === 'wall') {
                    content += ' ';
                } else if (tile === 'floor') {
                    content += '{blue-fg}·{/blue-fg}';
                } else {
                    content += ' ';
                }
            }
        }
        content += '\n';
    }
    mapBox.setContent(content);
    screen.render();
}

draw();