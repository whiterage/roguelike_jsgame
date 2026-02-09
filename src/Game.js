import MapGenerator from "./domain/logic/MapGenerator.js";
import Character from "./domain/entities/Character.js";
import {ITEM_TYPES} from "./domain/entities/Item.js";
import ScoreService from "./domain/services/ScoreService.js";

export default class Game {
    constructor() {
        const width = process.stdout.columns ? process.stdout.columns - 4 : 80;
        const height = process.stdout.rows ? process.stdout.rows - 6 : 24;

        this.generator = new MapGenerator(width, height);
        this.scoreService = new ScoreService();

        this._initGame();
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
        this.logMessage("{yellow-fg}Welcome to the Dark Dungeon! Reach Level 21...{/}");

        this._nextLevel();
    }

    _nextLevel() {
        if (this.levelCounter > 21) {
            this._handleWin();
            return;
        }

        this.level = this.generator.generate(this.levelCounter);
        this.hero.setPosition(this.level.startPoint.x, this.level.startPoint.y);
        this.logMessage(`{bold}Descended to Level ${this.levelCounter}{/bold}`);
    }

    _handleWin() {
        this.logMessage(`{green-bg}{black-fg} VICTORY! You conquered the dungeon! {/}`);
        this.scoreService.addScore(this.levelCounter, this.score);

        setTimeout(() => {
            console.clear();
            console.log("\n🏆 --- HALL OF FAME --- 🏆");
            const top = this.scoreService.getTopScores();
            top.forEach((s, i) => console.log(`${i + 1}. Gold: ${s.gold} (Lvl ${s.level}) - ${s.date}`));
            process.exit(0);
        }, 2000);
    }

    _handleDefeat() {
        this.logMessage(`{red-bg}{white-fg} YOU DIED! Score saved. Press any key to restart. {/}`);
        this.scoreService.addScore(this.levelCounter, this.score);
        this.hero.hp = 0;
    }

    processInput(key) {
        if (this.hero.hp <= 0) {
            this._initGame();
            return;
        }

        if (this.hero.isSleeping) {
            this.hero.isSleeping = false;
            this.logMessage('{magenta-fg}You wake up from magical sleep.{/}');
            this._updateEnemies();
            return;
        }

        // ОБНОВЛЕНИЕ БАФФОВ (Эликсиры)
        const expired = this.hero.updateBuffs();
        expired.forEach(buff => {
            this.logMessage(`{cyan-fg}Effect of ${buff.stat} wore off.{/}`);
        });

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

        if (item.type === ITEM_TYPES.ELIXIR) {
            this.logMessage(`You drank {magenta-fg}${item.name}{/}.`);

            if (item.agility) {
                this.hero.applyBuff('agility', item.agility, item.duration);
                this.logMessage(`{green-fg}Agility +${item.agility} for ${item.duration} turns.{/}`);
            }
            if (item.maxHpBonus) {
                this.hero.applyBuff('maxHp', item.maxHpBonus, item.duration);
                this.logMessage(`{green-fg}MaxHP +${item.maxHpBonus} for ${item.duration} turns.{/}`);
            }

            this.hero.inventory.splice(index, 1);
            return;
        }

        this.logMessage(`You used {cyan-fg}${item.name}{/}.`);

        if (item.healthBonus) {
            this.hero.heal(item.healthBonus);
        }
        if (item.strength) {
            this.hero.strength += item.strength;
            this.logMessage(`{yellow-fg}Strength permanently increased!{/}`);
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

    // Боевая система. Формулы в mathAttack.md
    _resolveCombat(attacker, defender) {
        const attName = (attacker === this.hero) ? "You" : attacker.type;
        const defName = (defender === this.hero) ? "you" : defender.type;
        const color = (attacker === this.hero) ? "green-fg" : "red-fg";

        if (defender.type === 'vampire' && !defender.firstHitTaken) {
            defender.firstHitTaken = true;
            this.logMessage(`{grey-fg}The Vampire dodged your first attack!{/}`);
            return;
        }

        const hitChance = attacker.agility / (attacker.agility + defender.agility);
        const roll = Math.random();

        if (roll > hitChance) {
            this.logMessage(`{grey-fg}${attName} missed ${defName}.{/}`);
            return;
        }

        let damage = (attacker === this.hero) ? attacker.attackDamage : attacker.strength;

        defender.takeDamage(damage);

        this.logMessage(`{${color}}${attName} hit ${defName} for ${damage} dmg.{/}`);

        if (attacker !== this.hero) {
            if (attacker.type === 'snake' && Math.random() < 0.2) {
                defender.isSleeping = true;
                this.logMessage('{magenta-fg}The Snake hypnotized you!{/}');
            }

            if (attacker.type === 'vampire') {
                const healAmount = Math.ceil(damage * 0.5);
                attacker.heal(healAmount);

                const drain = 5;
                defender.maxHp -= drain;
                if (defender.hp > defender.maxHp) defender.hp = defender.maxHp;

                this.logMessage(`{red-fg}Vampire drains HP and ${drain} MaxHP!{/}`);
            }

            if (attacker.type === 'ogre') {
                attacker.isResting = true;
                this.logMessage(`{yellow-fg}Ogre is exhausted.{/}`);
            }
        }

        if (defender.hp <= 0) {
            if (defender === this.hero) {
                this._handleDefeat();
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

        const countOfType = this.hero.inventory.filter(i => i.type === item.type).length;

        if (countOfType < 9) {
            this.hero.inventory.push(item);
            this.level.removeItem(item);
            this.logMessage(`You picked up {cyan-fg}${item.name}{/}.`);
        } else {
            this.logMessage(`{red-fg}Cannot carry more ${item.type}s!{/}`);
        }
    }

    logMessage(message) {
        this.log.push(message);
        if (this.log.length > 10) {
            this.log.shift();
        }
    }
}