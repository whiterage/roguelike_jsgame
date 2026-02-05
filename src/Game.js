import MapGenerator from "./domain/logic/MapGenerator.js";
import Character from "./domain/entities/Character.js";
import {ITEM_TYPES} from "./domain/entities/Item.js";

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
        this._initGame();
    }

    _nextLevel() {
        this.level = this.generator.generate(this.levelCounter);
        this.hero.setPosition(this.level.startPoint.x, this.level.startPoint.y);
    }

    processInput(key) {
        const MOVES = {
            w: {x: 0, y: -1},
            s: {x: 0, y: 1},
            a: {x: -1, y: 0},
            d: {x: 1, y: 0}
        };

        const move = MOVES[key];
        if (!move) return;

        const newX = this.hero.x + move.x;
        const newY = this.hero.y + move.y;

        if (this.level.getTile(newX, newY) === 'wall') return;

        const enemy = this.level.monsters.find(m => m.x === newX && m.y === newY);
        if (enemy) {
            this._resolveCombat(this.hero, enemy);
            this._updateEnemies();
            return;
        }

        this.hero.setPosition(newX, newY);
        const item = this.level.items.find(i => i.x === newX && i.y === newY);
        if (item) {
            this._handlePickup(item);
        }

        if (newX === this.level.stairsDown.x && newY === this.level.stairsDown.y) {
            this.levelCounter++;
            this._nextLevel();
            return;
        }

        this._updateEnemies();
    }

    _updateEnemies() {
        this.level.monsters.forEach(m => {
            m.update(this.level, this.hero, () => {
                this._resolveCombat(m, this.hero);
            });
        });
    }

    _initGame() {
        this.levelCounter = 1;
        this.score = 0;

        this.hero = new Character({
            maxHp: 100,
            strength: 10,
            agility: 10
        });

        this.hero.inventory = [];
        this.hero.treasures = 0;

        this._nextLevel();
    }

    // Боевая система. Формулы в mathAttack.md
    _resolveCombat(attacker, defender) {
        const hitChance = attacker.agility / (attacker.agility + defender.agility);
        const roll = Math.random();

        if (roll > hitChance) {
            return; // промах
        }

        const damage = attacker.strength;
        defender.hp -= damage;

        if (defender.hp <= 0) {
            if (defender === this.hero) {
                this._initGame();
            } else {
                this._killMonster(defender);
            }
        }
    }

    _killMonster(monster) {
        this.level.monsters = this.level.monsters.filter(m => m !== monster);

        // логика награды
        const reward = Math.floor((monster.maxHp + monster.strength + monster.agility + monster.hostility) / 10);
        this.score += reward;
        console.log(`You killed ${monster.type} and got ${reward} gold!`);
    }

    _handlePickup(item) {
        if (item.type === ITEM_TYPES.TREASURE) {
            this.hero.treasures += item.price;
            this.score += item.price;
            this.level.removeItem(item);
            return;
        }

        if (this.hero.inventory.length < 9) {
            this.hero.inventory.push(item);
            this.level.removeItem(item);
        }
    }
}