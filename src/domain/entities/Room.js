export default class Room {
    constructor({x, y, width, height}) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    // для удобства в будущем
    get left() {
        return this._x;
    }

    get right() {
        return this._x + this._width;
    }

    get top() {
        return this._y;
    }

    get bottom() {
        return this._y + this._height;
    }

    // определим сразу центр комнаты, чтобы не париться с расчетами в будущем
    get center() {
        return {
            x: Math.floor(this._x + this._width / 2),
            y: Math.floor(this._y + this._height / 2)
        };
    }
}