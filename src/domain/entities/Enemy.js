import Entity from "./Entity.js";

export default class Enemy extends Entity {
    constructor({type, isEvil, maxHp, strength, agility}) {
        super({
            maxHp,
            strength,
            agility,
            name: type
        });
        this._type = type;
        this._isEvil = true;
    }

    get isEvil() {
        return this._isEvil;
    }

    get type() {
        return this._type;
    }
}