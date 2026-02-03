export default class Entity {
    constructor({maxHp, hp, strength, agility, name = "Unknown"}) {
        this._maxHp = maxHp;
        this._hp = hp || maxHp;
        this._strength = strength;
        this._agility = agility;
        this._name = name;

        this.x = 0;
        this.y = 0;
    }

    get hp() {
        return this._hp;
    }

    get strength() {
        return this._strength;
    }

    get agility() {
        return this._agility;
    }

    get name() {
        return this._name;
    }

    get maxHp() {
        return this._maxHp;
    }

    takeDamage(damage) {
        this._hp -= damage;
        if (this._hp < 0) this._hp = 0;
    }

    heal(heal) {
        this._hp += heal;
        if (this._hp > this._maxHp) this._hp = this._maxHp;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}