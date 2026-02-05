export default class Level {
    constructor({
                    width,
                    height,
                    rooms = [],
                    monsters = [],
                    items = [],
                    startPoint = {x: 0, y: 0},
                    stairsDown = null,
                }) {
        this._width = width;
        this._height = height;
        this._rooms = rooms;
        this._monsters = monsters;
        this._items = items;
        this._startPoint = startPoint;
        this._stairsDown = stairsDown;

        this._tiles = [];
        for (let y = 0; y < this._height; y++) {
            const row = [];
            for (let x = 0; x < this._width; x++) {
                row.push('wall');
            }
            this._tiles.push(row);
        }
    }

    get monsters() {
        return this._monsters;
    }

    set monsters(value) {
        this._monsters = value;
    }

    addEnemy(enemy) {
        this._monsters.push(enemy);
    }

    get items() {
        return this._items;
    }

    set items(value) {
        this._items = value;
    }

    addItem(item) {
        this._items.push(item);
    }

    removeItem(item) {
        this._items = this._items.filter(i => i !== item);
    }

    get rooms() {
        return this._rooms;
    }

    get startPoint() {
        return this._startPoint;
    }

    get stairsDown() {
        return this._stairsDown;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    set startPoint(point) {
        this._startPoint = point;
    }

    set stairsDown(point) {
        this._stairsDown = point;
    }

    getTile(x, y) {
        if (x >= 0 && x < this._width && y >= 0 && y < this._height) {
            return this._tiles[y][x];
        }
        return 'wall';
    }

    setTile(x, y, type) {
        if ((x >= 0 && x < this._width) && (y >= 0 && y < this._height)) {
            this._tiles[y][x] = type;
        }
    }
}