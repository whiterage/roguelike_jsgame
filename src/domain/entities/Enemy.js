import Entity from "./Entity.js";

const ENEMY_STATS = {
    zombie: {maxHP: 300, strength: 100, agility: 20, hostility: 30, symbol: 'z', color: 'green'},
    vampire: {maxHP: 400, strength: 150, agility: 100, hostility: 80, symbol: 'v', color: 'red'},
    ghost: {maxHP: 150, strength: 50, agility: 150, hostility: 40, symbol: 'g', color: 'white'},
    ogre: {maxHP: 600, strength: 300, agility: 10, hostility: 20, symbol: 'O', color: 'yellow'},
    snake: {maxHP: 200, strength: 120, agility: 200, hostility: 60, symbol: 's', color: 'white'}
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
}