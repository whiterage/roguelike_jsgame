export default class Entity {
    constructor({maxHp, strength, agility, name = "Unknown"}) {
        this._maxHp = maxHp;
        this._hp = maxHp;
        this._strength = strength;
        this._agility = agility;
        this._name = name;

        this._x = 0;
        this._y = 0;
    }

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
    }

    get hp() {
        return this._hp;
    }

    set hp(value) {
        this._hp = value;
        if (this._hp > this._maxHp) this._hp = this._maxHp;
    }

    get maxHp() {
        return this._maxHp;
    }

    set maxHp(value) {
        this._maxHp = value;
    }

    get strength() {
        return this._strength;
    }

    set strength(value) {
        this._strength = value;
    }

    get agility() {
        return this._agility;
    }

    set agility(value) {
        this._agility = value;
    }

    get name() {
        return this._name;
    }

    setPosition(x, y) {
        this._x = x;
        this._y = y;
    }

    equipWeapon(weapon) {
        this._weapon = weapon;
    }

    get attackDamage() {
        let damage = this.strength;
        if (this._weapon) {
            damage += this._weapon.strength;
        }
        return damage;
    }

    takeDamage(damage) {
        this._hp -= damage;
    }
}