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
        this._inventory = [];

        this._buffs = [];
        this.isSleeping = false;
    }

    get weapon() {
        return this._weapon;
    }

    get inventory() {
        return this._inventory;
    }

    set inventory(value) {
        this._inventory = value;
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

    applyBuff(statName, value, duration) {
        if (statName === 'strength') this.strength += value;
        if (statName === 'agility') this.agility += value;

        if (statName === 'maxHp') {
            this.maxHp += value;
            this.hp += value;
        }

        this._buffs.push({
            stat: statName,
            value: value,
            duration: duration
        });
    }

    updateBuffs() {
        const expiredBuffs = [];

        this._buffs = this._buffs.filter(buff => {
            buff.duration--;

            if (buff.duration <= 0) {
                this._removeBuffEffect(buff);
                expiredBuffs.push(buff);
                return false;
            }
            return true;
        });

        return expiredBuffs;
    }

    _removeBuffEffect(buff) {
        if (buff.stat === 'strength') this.strength -= buff.value;
        if (buff.stat === 'agility') this.agility -= buff.value;

        if (buff.stat === 'maxHp') {
            this.maxHp -= buff.value;
            if (this.hp > this.maxHp) {
                this.hp = this.maxHp;
            }
            if (this.hp <= 0) {
                this.hp = 1;
            }
        }
    }
}