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
        if (this.hero.hp <= 0) {
            this._initGame();
            return;
        }

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

    useItem(index) {
        const item = this.hero.inventory[index];
        if (!item) return;

        this.logMessage(`You used {cyan-fg}${item.name}{/}.`);

        if (item.healthBonus) {
            this.hero.hp = Math.min(this.hero.hp + item.healthBonus, this.hero.maxHp);
        }
        if (item.maxHpBonus) {
            this.hero.maxHp += item.maxHpBonus;
            this.hero.hp += item.maxHpBonus;
        }
        if (item.strength) {
            this.hero.strength += item.strength;
        }
        if (item.agility) {
            this.hero.agility += item.agility;
        }

        this.hero.inventory.splice(index, 1);
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

        this.log = [];
        this.logMessage("{yellow-fg}Welcome to the Dark Dungeon! Find the exit...{/}");

        this._nextLevel();
    }

    logMessage(message) {
        this.log.push(message);
        if (this.log.length > 10) {
            this.log.shift();
        }
    }

    // Боевая система. Формулы в mathAttack.md
    _resolveCombat(attacker, defender) {
        const attName = (attacker === this.hero) ? "You" : attacker.type;
        const defName = (defender === this.hero) ? "you" : defender.type;
        const color = (attacker === this.hero) ? "green-fg" : "red-fg";

        const hitChance = attacker.agility / (attacker.agility + defender.agility);
        const roll = Math.random();

        if (roll > hitChance) {
            this.logMessage(`{grey-fg}${attName} missed ${defName}.{/}`);
            return; // промах
        }

        const damage = attacker.strength;
        defender.hp -= damage;

        this.logMessage(`{${color}}${attName} hit ${defName} for ${damage} dmg.{/}`);

        // логика вампира
        if (attacker.type === 'vampire') {
            const healAmount = Math.ceil(damage * 0.5);
            attacker.hp += healAmount; // Лечим вампира
            this.logMessage(`{red-fg}Vampire drains ${healAmount} HP!{/}`);
        }

        if (defender.hp <= 0) {
            if (defender === this.hero) {
                this.logMessage(`{red-bg}{white-fg} YOU DIED! Press any key to restart. {/}`);
                this.hero.hp = 0;
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

        this.hero.treasures += reward;

        this.logMessage(`You killed {red-fg}${monster.type}{/} and got {yellow-fg}${reward} gold{/}.`);
    }

    _handlePickup(item) {
        if (item.type === ITEM_TYPES.TREASURE) {
            this.hero.treasures += item.price;
            this.score += item.price;
            this.level.removeItem(item);
            this.logMessage(`You picked up {yellow-fg}${item.price} gold{/}.`);
            return;
        }

        if (this.hero.inventory.length < 9) {
            this.hero.inventory.push(item);
            this.level.removeItem(item);
            this.logMessage(`You picked up {cyan-fg}${item.name}{/}.`);
        } else {
            this.logMessage(`{red-fg}Inventory full! Cannot pick up ${item.name}.{/}`);
        }
    }
}