import Entity from "./Entity.js";

export default class Character extends Entity {
    constructor({maxHp, strength, agility}) {
        super({
            maxHp,
            strength,
            agility,
            name: "Hero"
        });

        this._weapon = null;
        this._backpack = [];
    }

    get weapon() {
        return this._weapon;
    }

    get backpack() {
        return this._backpack;
    }

    equipWeapon(weapon) {
        this._weapon = weapon;
    }
}