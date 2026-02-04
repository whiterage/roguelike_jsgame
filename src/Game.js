import MapGenerator from "./domain/logic/MapGenerator.js";
import Character from "./domain/entities/Character.js";

export default class Game {
    constructor() {
        const width = process.stdout.columns - 4;
        const height = process.stdout.rows - 6;

        this.generator = new MapGenerator(width, height);
        this.levelCounter = 1;

        this.hero = new Character({
            maxHp: 100,
            strength: 20,
            agility: 20
        });

        this._nextLevel();
    }

    _nextLevel() {
        this.level = this.generator.generate();
        this.hero.setPosition(this.level.startPoint.x, this.level.startPoint.y);
    }

    processInput(key) {
        const MOVES = {
            w: { x: 0, y: -1 },
            s: { x: 0, y: 1 },
            a: { x: -1, y: 0 },
            d: { x: 1, y: 0 }
        };

        const move = MOVES[key];
        if (!move) return;

        const newX = this.hero.x + move.x;
        const newY = this.hero.y + move.y;

        if (this.level.getTile(newX, newY) === 'wall') return;

        const enemy = this.level.monsters.find(m => m.x === newX && m.y === newY);
        if (enemy) {
            this._handleAttack(enemy);
            this._updateEnemies();
            return;
        }

        this.hero.setPosition(newX, newY);

        if (newX === this.level.stairsDown.x && newY === this.level.stairsDown.y) {
            this.levelCounter++;
            this._nextLevel();
            return;
        }

        this._updateEnemies();
    }

    _handleAttack(enemy) {
        enemy.hp = (enemy.hp || enemy.maxHp) - 10;

        if (enemy.hp <= 0) {
            this.level.monsters = this.level.monsters.filter(m => m !== enemy);
        }
    }

    _updateEnemies() {
        this.level.monsters.forEach(m => {
            m.update(this.level, this.hero);
        });
    }
}