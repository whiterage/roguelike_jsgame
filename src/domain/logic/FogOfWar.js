export default class FogOfWar {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.explored = Array(height).fill().map(() => Array(width).fill(false));

        this.visible = Array(height).fill().map(() => Array(width).fill(false));
    }

    update(hero, level) {
        this.visible = this.visible.map(row => row.fill(false));

        let inRoom = false;
        for (const room of level.rooms) {
            if (hero.x >= room.x && hero.x < room.x + room.width &&
                hero.y >= room.y && hero.y < room.y + room.height) {

                inRoom = true;
                for (let y = room.y - 1; y <= room.y + room.height; y++) {
                    for (let x = room.x - 1; x <= room.x + room.width; x++) {
                        this._setVisible(x, y);
                    }
                }
                break;
            }
        }

        const RADIUS = 7;

        for (let y = -RADIUS; y <= RADIUS; y++) {
            for (let x = -RADIUS; x <= RADIUS; x++) {
                if (x * x + y * y <= RADIUS * RADIUS) {
                    this._castRay(hero.x, hero.y, hero.x + x, hero.y + y, level);
                }
            }
        }
    }

    _setVisible(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.visible[y][x] = true;
            this.explored[y][x] = true;
        }
    }

    _castRay(x0, y0, x1, y1, level) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        let cx = x0;
        let cy = y0;

        while (true) {
            this._setVisible(cx, cy);

            if (level.getTile(cx, cy) === 'wall') break;

            if (cx === x1 && cy === y1) break;

            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                cx += sx;
            }
            if (e2 < dx) {
                err += dx;
                cy += sy;
            }
        }
    }
}