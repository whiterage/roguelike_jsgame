export default class Item {
    constructor({
                    name = "Unknown Item",
                    id = crypto.randomUUID(),
                    type,
                    subtype = null,
                    healthBonus = 0,
                    maxHpBonus = 0,
                    agility = 0,
                    strength = 0,
                    price = 0
                }) {
        this._name = name;
        this._id = id;
        this._type = type;
        this._subtype = subtype;

        this._healthBonus = healthBonus;
        this._maxHpBonus = maxHpBonus;
        this._agility = agility;
        this._strength = strength;
        this._price = price;
    }

    get name() {
        return this._name;
    }

    get id() {
        return this._id;
    }

    get type() {
        return this._type;
    }

    get subtype() {
        return this._subtype;
    }

    get healthBonus() {
        return this._healthBonus;
    }

    get maxHpBonus() {
        return this._maxHpBonus;
    }

    get agility() {
        return this._agility;
    }

    get strength() {
        return this._strength;
    }

    get price() {
        return this._price;
    }
}