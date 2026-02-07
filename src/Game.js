import MapGenerator from "./domain/logic/MapGenerator.js";
import Character from "./domain/entities/Character.js";
import {ITEM_TYPES} from "./domain/entities/Item.js";

export default class Game {
    constructor() {
        const width = process.stdout.columns ? process.stdout.columns - 4 : 80;
        const height = process.stdout.rows ? process.stdout.rows - 6 : 24;

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

        if (this.hero.isSleeping) {
            this.hero.isSleeping = false;
            this.logMessage('{magenta-fg}You are sleeping... Zzz...{/}');
            this._updateEnemies();
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

        if (item.type === ITEM_TYPES.WEAPON) {
            this._equipWeapon(item, index);
            return;
        }

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

    _equipWeapon(newItem, inventoryIndex) {
        if (this.hero.weapon) {
            const oldWeapon = this.hero.weapon;
            this._dropItemNearby(oldWeapon, this.hero.x, this.hero.y);
            this.logMessage(`You dropped {white-fg}${oldWeapon.name}{/}.`);
        }

        this.hero.equipWeapon(newItem);
        this.logMessage(`You equipped {cyan-fg}${newItem.name}{/}! Dmg: ${this.hero.attackDamage}`);

        this.hero.inventory.splice(inventoryIndex, 1);
    }

    _dropItemNearby(item, x, y) {
        const neighbors = [
            {x: x + 1, y: y}, {x: x - 1, y: y},
            {x: x, y: y + 1}, {x: x, y: y - 1},
            {x: x + 1, y: y + 1}, {x: x - 1, y: y - 1},
            {x: x + 1, y: y - 1}, {x: x - 1, y: y + 1}
        ];

        let dropSpot = {x: x, y: y};

        for (const spot of neighbors) {
            if (this.level.getTile(spot.x, spot.y) === 'floor') {
                dropSpot = spot;
                break;
            }
        }

        item.x = dropSpot.x;
        item.y = dropSpot.y;
        this.level.addItem(item);
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

        let damage = 0;
        if (attacker === this.hero) {
            damage = attacker.attackDamage;
        } else {
            damage = attacker.strength;
        }

        defender.takeDamage(damage);

        this.logMessage(`{${color}}${attName} hit ${defName} for ${damage} dmg.{/}`);

        // логика змеи
        if (attacker !== this.hero) {
            if (attacker.type === 'snake') {
                if (Math.random() < 0.2) {
                    defender.isSleeping = true;
                    this.logMessage('{magenta-fg}The Snake hypnotized you!{/}');
                }
            }
        }

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