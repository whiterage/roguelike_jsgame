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

        if (distance > this.hostility) return;

        let moveX = 0;
        let moveY = 0;


        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = Math.sign(dx);
        } else {
            moveY = Math.sign(dy);
        }

        const destX = this.x + moveX;
        const destY = this.y + moveY;

        if (level.getTile(destX, destY) === 'wall') return;

        const isOccupied = level.monsters.some(m => m !== this && m.x === destX && m.y === destY);
        if (isOccupied) return;

        const isHeroThere = (hero.x === destX && hero.y === destY);
        if (isHeroThere) {
            if (onAttack) {
                onAttack(this, hero);
            }
            return;
        }

        this.x = destX;
        this.y = destY;
    }
}