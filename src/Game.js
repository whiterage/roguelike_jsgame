import MapGenerator from "./domain/logic/MapGenerator.js";
import Character from "./domain/entities/Character.js";
import {ITEM_TYPES} from "./domain/entities/Item.js";
import ScoreService from "./domain/services/ScoreService.js";
import FogOfWar from "./domain/logic/FogOfWar.js";
import {
    TERMINAL_PADDING_X,
    TERMINAL_PADDING_Y,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    MAX_ITEMS_PER_TYPE,
    MAX_LEVELS,
} from "./config.js";
import SaveService from "./domain/services/SaveService.js";
import Level from "./domain/entities/Level.js";
import Enemy from "./domain/entities/Enemy.js";

export default class Game {
    constructor() {
        const width = process.stdout.columns ? process.stdout.columns - TERMINAL_PADDING_X : DEFAULT_WIDTH;
        const height = process.stdout.rows ? process.stdout.rows - TERMINAL_PADDING_Y : DEFAULT_HEIGHT;

        this.width = width;
        this.height = height;

        this.generator = new MapGenerator(width, height);
        this.scoreService = new ScoreService();
        this.fog = new FogOfWar(width, height);

        this.stats = {
            gold: 0,
            level: 1,
            enemiesKilled: 0,
            foodEaten: 0,
            elixirsDrank: 0,
            scrollsRead: 0,
            damageDealt: 0,
            damageTaken: 0,
            stepsTaken: 0,
            itemsPicked: 0
        };

        this.inputMode = 'normal';
        this.itemSelectionType = null;

        this._initGame();
    }

    saveGameState() {
        const state = {
            levelCounter: this.levelCounter,
            score: this.score,
            stats: this.stats,
            log: this.log,
            hero: this.hero,
            level: {
                width: this.level.width,
                height: this.level.height,
                startPoint: this.level.startPoint,
                stairsDown: this.level.stairsDown,
                rooms: this.level.rooms,
                tiles: this.level.tiles,
                doors: this.level.doors,
                monsters: this.level.monsters,
                items: this.level.items
            },
            fog: {
                visible: this.fog.visible,
                explored: this.fog.explored
            }
        };
        SaveService.save(state);
    }

    loadGameState(data) {
        this.levelCounter = data.levelCounter;
        this.score = data.score;
        this.stats = data.stats;
        this.log = data.log;

        Object.assign(this.hero, data.hero);
        if (!this.hero._keyring || typeof this.hero._keyring !== 'object') {
            this.hero._keyring = {};
        }

        this.level = new Level({
            width: data.level.width,
            height: data.level.height,
            rooms: data.level.rooms || [],
            monsters: [],
            items: data.level.items || [],
            doors: data.level.doors || [],
            startPoint: data.level.startPoint || { x: 0, y: 0 },
            stairsDown: data.level.stairsDown,
            tiles: data.level.tiles || null
        });

        this.level.monsters = (data.level.monsters || []).map(mData => {
            const m = new Enemy(mData.type, mData.x, mData.y);
            Object.assign(m, mData);
            return m;
        });

        this.fog = new FogOfWar(this.width, this.height);
        this.fog.visible = data.fog.visible;
        this.fog.explored = data.fog.explored;

        this.logMessage("{green-fg}Game loaded successfully!{/}");
    }

    quitAndSave() {
        this.saveGameState();
        console.clear();
        console.log("💾 Game saved. See you next time!");
        process.exit(0);
    }

    _initGame() {
        this.levelCounter = 1;
        this.score = 0;

        for (let key in this.stats) this.stats[key] = 0;
        this.stats.level = 1;

        this.hero = new Character({maxHp: 100, strength: 10, agility: 10});
        this.log = [];
        this.logMessage("{yellow-fg}Welcome to the Dark Dungeon!{/}");

        this._nextLevel();
    }

    _nextLevel() {
        if (this.levelCounter > MAX_LEVELS) {
            this._handleWin();
            return;
        }

        this.stats.level = this.levelCounter;
        this.level = this.generator.generate(this.levelCounter);
        this.hero.setPosition(this.level.startPoint.x, this.level.startPoint.y);

        this.fog = new FogOfWar(this.width, this.height);
        this.fog.update(this.hero, this.level);

        this.logMessage(`{bold}Descended to Level ${this.levelCounter}{/bold}`);
        this.saveGameState();
    }

    _handleWin() {
        this.stats.gold = this.hero.treasures;
        this.logMessage(`{green-bg}{black-fg} VICTORY! You conquered the dungeon! {/}`);

        this.scoreService.addScore(this.stats);

        setTimeout(() => {
            console.clear();
            console.log("\n🏆 --- HALL OF FAME --- 🏆");
            const top = this.scoreService.getTopScores();
            top.forEach((s, i) => console.log(`${i + 1}. Gold: ${s.gold} | Lvl: ${s.level} | Kills: ${s.enemiesKilled} | Date: ${s.date}`));
            process.exit(0);
        }, 2000);
        SaveService.clearSave();
    }

    _handleDefeat() {
        this.stats.gold = this.hero.treasures;
        this.logMessage(`{red-bg}{white-fg} YOU DIED! Score saved. Press any key to restart. {/}`);

        this.scoreService.addScore(this.stats);
        this.hero.hp = 0;
        SaveService.clearSave();
    }

    processInput(key) {
        if (this.inputMode === 'select_item') {
            const index = parseInt(key) - 1;

            if (!isNaN(index) && index >= -1 && index < MAX_ITEMS_PER_TYPE) {
                this._useItemByType(this.itemSelectionType, index);
            } else {
                this.logMessage("{red-fg}Cancelled.{/}");
            }
            this.inputMode = 'normal';
            this.itemSelectionType = null;
            return;
        }

        if (key === 'h') {
            this._startItemSelection(ITEM_TYPES.WEAPON);
            return;
        }
        if (key === 'j') {
            this._startItemSelection(ITEM_TYPES.FOOD);
            return;
        }
        if (key === 'k') {
            this._startItemSelection(ITEM_TYPES.ELIXIR);
            return;
        }
        if (key === 'e') {
            this._startItemSelection(ITEM_TYPES.SCROLL);
            return;
        }

        if (this.hero.hp <= 0) {
            this._initGame();
            return;
        }

        if (this.hero.isSleeping) {
            this.hero.isSleeping = false;
            this.logMessage('{magenta-fg}You wake up.{/}');
            this._updateEnemies();
            return;
        }

        this.hero.updateBuffs().forEach(b => this.logMessage(`{cyan-fg}${b.stat} ended.{/}`));

        const MOVES = {w: {x: 0, y: -1}, s: {x: 0, y: 1}, a: {x: -1, y: 0}, d: {x: 1, y: 0}};
        const move = MOVES[key];
        if (!move) return;

        const newX = this.hero.x + move.x;
        const newY = this.hero.y + move.y;

        if (this.level.getTile(newX, newY) === 'wall') return;

        const door = this.level.getDoorAt(newX, newY);
        if (door) {
            if (!this.hero.hasKey(door.color)) {
                const colorName = door.color.charAt(0).toUpperCase() + door.color.slice(1);
                this.logMessage(`{yellow-fg}The ${colorName} door is locked. You need the ${colorName} Key!{/}`);
                return;
            }
        }

        const enemy = this.level.monsters.find(m => m.x === newX && m.y === newY);
        if (enemy) {
            this._resolveCombat(this.hero, enemy);
            this._updateEnemies();
            this.fog.update(this.hero, this.level);
            return;
        }

        this.hero.setPosition(newX, newY);
        this.stats.stepsTaken++;

        if (door) {
            const colorName = door.color.charAt(0).toUpperCase() + door.color.slice(1);
            this.logMessage(`{green-fg}You unlock the ${colorName} door with the key.{/}`);
        }

        const item = this.level.items.find(i => i.x === newX && i.y === newY);
        if (item) this._handlePickup(item);

        if (newX === this.level.stairsDown.x && newY === this.level.stairsDown.y) {
            this.levelCounter++;
            this._nextLevel();
            return;
        }

        this.fog.update(this.hero, this.level);
        this._updateEnemies();
    }

    _startItemSelection(type) {
        const items = this.hero.inventory.filter(i => i.type === type);

        if (items.length === 0) {
            this.logMessage(`{red-fg}You have no ${type}s.{/}`);
            return;
        }

        this.inputMode = 'select_item';
        this.itemSelectionType = type;
        this.logMessage(`{bold}Select ${type} (1-${items.length}, 0 cancel):{/bold}`);
    }

    _useItemByType(type, selectionIndex) {
        const itemsOfType = this.hero.inventory.filter(i => i.type === type);

        if (type === ITEM_TYPES.WEAPON && selectionIndex === -1) {
            if (this.hero.weapon) {
                this.logMessage(`You unequipped {white-fg}${this.hero.weapon.name}{/}.`);
                this.hero.equipWeapon(null);
            } else {
                this.logMessage(`You are not holding any weapon.`);
            }
            return;
        }

        const targetItem = itemsOfType[selectionIndex];
        if (!targetItem) {
            this.logMessage("{red-fg}Invalid selection.{/}");
            return;
        }

        const realIndex = this.hero.inventory.indexOf(targetItem);
        this.useItem(realIndex);
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
            this.stats.elixirsDrank++;
            if (item.agility) this.hero.applyBuff('agility', item.agility, item.duration);
            if (item.maxHpBonus) this.hero.applyBuff('maxHp', item.maxHpBonus, item.duration);
            this.hero.inventory.splice(index, 1);
            return;
        }
        if (item.type === ITEM_TYPES.SCROLL) {
            this.stats.scrollsRead++;
            const bonus = item.strength || item.value || item.bonus || 2;
            this.hero.strength += item.strength;
            this.logMessage(`{yellow-fg}Strength permanently increased!{/}`);
            this.hero.inventory.splice(index, 1);
            return;
        }

        this.logMessage(`You ate {red-fg}${item.name}{/}.`);
        this.stats.foodEaten++;
        const heal = item.healthBonus || item.value || 25;
        this.hero.heal(item.healthBonus);
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

        if (attacker === this.hero) this.stats.damageDealt += damage;
        if (defender === this.hero) this.stats.damageTaken += damage;

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

        const reward = Math.floor((monster.maxHp + monster.strength + monster.agility + monster.hostility) / 10);
        this.score += reward;
        this.hero.treasures += reward;

        this.stats.enemiesKilled++;

        this.logMessage(`You killed {red-fg}${monster.type}{/} and got {yellow-fg}${reward} gold{/}.`);
    }

    _handlePickup(item) {
        if (item.type === ITEM_TYPES.KEY) {
            this.hero.addKey(item.keyColor);
            this.level.removeItem(item);
            const colorName = item.keyColor.charAt(0).toUpperCase() + item.keyColor.slice(1);
            this.logMessage(`You picked up the {bold}${colorName} Key{/bold}!`);
            return;
        }

        if (item.type === ITEM_TYPES.TREASURE) {
            const amount = item.price ?? item.value ?? 15;
            this.hero.treasures += amount;
            this.score += amount;
            this.level.removeItem(item);
            this.logMessage(`You picked up {yellow-fg}${amount} gold{/}.`);
            return;
        }

        const countOfType = this.hero.inventory.filter(i => i.type === item.type).length;

        if (countOfType < MAX_ITEMS_PER_TYPE) {
            this.hero.inventory.push(item);
            this.level.removeItem(item);
            this.logMessage(`You picked up {cyan-fg}${item.name}{/}.`);
            this.stats.itemsPicked++;
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