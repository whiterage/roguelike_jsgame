import crypto from 'node:crypto';

export const ITEM_TYPES = {
    TREASURE: 'treasure',
    FOOD: 'food',
    WEAPON: 'weapon',
    SCROLL: 'scroll',
    ELIXIR: 'elixir'
};

const ITEMS_DB = [
    {type: ITEM_TYPES.FOOD, name: 'Apple', value: 20, symbol: 'a', color: 'red'},
    {type: ITEM_TYPES.WEAPON, name: 'Rusty Sword', value: 5, symbol: '†', color: 'white'},
    {type: ITEM_TYPES.TREASURE, name: 'Gold Coin', value: 50, symbol: '$', color: 'yellow'},
    {type: ITEM_TYPES.SCROLL, name: 'Scroll of Strength', value: 2, symbol: '#', color: 'cyan'},
    {type: ITEM_TYPES.ELIXIR, name: 'Healing Potion', value: 50, symbol: '!', color: 'magenta'}
];

export default class Item {
    constructor(template, x, y) {
        this._id = crypto.randomUUID();
        this._x = x;
        this._y = y;

        // копия из шаблона
        this._name = template.name;
        this._type = template.type;
        this._symbol = template.symbol;
        this._color = template.color;

        this._healthBonus = 0;
        this._maxHpBonus = 0;
        this._agility = 0;
        this._strength = 0;
        this._price = 0;

        this._assignStats(template.value);
    }

    _assignStats(value) {
        switch (this._type) {
            case ITEM_TYPES.FOOD:
                this._healthBonus = value;
                break;
            case ITEM_TYPES.SCROLL:
                this._strength = value;
                break;
            case ITEM_TYPES.ELIXIR:
                this._agility = value;
                break;
            case ITEM_TYPES.WEAPON:
                this._strength = value;
                break;
            case ITEM_TYPES.TREASURE:
                this._price = value;
                break;
        }
    }

    get id() {
        return this._id;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get name() {
        return this._name;
    }

    get type() {
        return this._type;
    }

    get symbol() {
        return this._symbol;
    }

    get color() {
        return this._color;
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

    static getRandomTemplate() {
        const index = Math.floor(Math.random() * ITEMS_DB.length);
        return ITEMS_DB[index];
    }
}