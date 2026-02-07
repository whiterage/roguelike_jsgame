import Entity from "./Entity.js";

const ENEMY_STATS = {
    zombie: {maxHP: 60, strength: 10, agility: 5, hostility: 6, symbol: 'z', color: 'green'},
    vampire: {maxHP: 80, strength: 20, agility: 15, hostility: 10, symbol: 'v', color: 'red'},
    ghost: {maxHP: 30, strength: 8, agility: 30, hostility: 8, symbol: 'g', color: 'white'},
    ogre: {maxHP: 150, strength: 30, agility: 2, hostility: 5, symbol: 'O', color: 'yellow'},
    snake: {maxHP: 40, strength: 12, agility: 25, hostility: 12, symbol: 's', color: 'white'}
};

export default class Enemy extends Entity {
    constructor(type, x, y) {
        const stats = ENEMY_STATS[type] || ENEMY_STATS.zombie;

        super({
            maxHp: stats.maxHP,
            strength: stats.strength,
            agility: stats.agility,
            name: type
        });

        this._type = type;
        this._isEvil = true;

        this._hostility = stats.hostility;
        this._symbol = stats.symbol;
        this._color = stats.color;

        this.x = x;
        this.y = y;

        this._skipTurn = false;
    }

    get isEvil() {
        return this._isEvil;
    }

    get type() {
        return this._type;
    }

    get hostility() {
        return this._hostility;
    }

    get color() {
        return this._color;
    }

    get symbol() {
        return this._symbol;
    }

    update(level, hero, onAttack) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (this.type === 'ogre') {
            if (this._skipTurn) {
                this._skipTurn = false;
                return; // Пропускает этот ход
            }
            this._skipTurn = true; // Следующий ход пропустит
        }

        if (this.type === 'ghost') {
            // 10% шанс телепортироваться в случайную точку комнаты
            if (Math.random() < 0.1) {
                this._teleport(level);
                return;
            }
        }

        if (distance > this.hostility) return;

        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);

        if (this.type === 'snake') {
            if (stepX !== 0 && stepY !== 0) {
                const moved = this._tryMove(this.x + stepX, this.y + stepY, level, hero, onAttack);
                if (moved) return;
            }
        }

        let moved = false;
        if (Math.abs(dx) >= Math.abs(dy)) {
            if (stepX !== 0) moved = this._tryMove(this.x + stepX, this.y, level, hero, onAttack);
            if (!moved && stepY !== 0) moved = this._tryMove(this.x, this.y + stepY, level, hero, onAttack);
        } else {
            if (stepY !== 0) moved = this._tryMove(this.x, this.y + stepY, level, hero, onAttack);
            if (!moved && stepX !== 0) moved = this._tryMove(this.x + stepX, this.y, level, hero, onAttack);
        }
    }

    _teleport(level) {
        // Ищем случайную свободную точку
        for (let i = 0; i < 10; i++) { // 10 попыток
            const rX = Math.floor(Math.random() * level.width);
            const rY = Math.floor(Math.random() * level.height);
            if (level.getTile(rX, rY) === 'floor') {
                // Проверка на занятость
                const occupied = level.monsters.some(m => m.x === rX && m.y === rY) ||
                    (level.startPoint.x === rX && level.startPoint.y === rY); // Не телепортируемся на героя
                if (!occupied) {
                    this.x = rX;
                    this.y = rY;
                    break;
                }
            }
        }
    }


    _tryMove(destX, destY, level, hero, onAttack) {
        if (this.type !== 'ghost') {
            if (level.getTile(destX, destY) === 'wall') return false;
        }

        if (!level.getTile(destX, destY)) return false;

        const isOccupied = level.monsters.some(m => m !== this && m.x === destX && m.y === destY);
        if (isOccupied) return false;

        if (hero.x === destX && hero.y === destY) {
            if (onAttack) onAttack(this, hero);
            return true;
        }

        this.x = destX;
        this.y = destY;
        return true;
    }
}