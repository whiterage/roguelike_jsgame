import Level from "../entities/Level.js";
import Room from "../entities/Room.js";
import Corridor from "../entities/Corridor.js";
import Enemy from "../entities/Enemy.js";
import Item from "../entities/Item.js";

export default class MapGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    generate(difficulty = 1) {
        const MAX_ATTEMPTS = 100;
        let attempts = 0;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;

            const level = new Level({width: this.width, height: this.height});

            const rooms = this._placeRooms(level);

            this._connectRooms(level, rooms);

            level.startPoint = rooms[0].center;
            level.stairsDown = rooms[rooms.length - 1].center;
            level.setTile(level.stairsDown.x, level.stairsDown.y, 'stairs');

            if (this._isMapConnected(level, rooms)) {
                this._spawnEnemies(level, rooms, difficulty);
                this._spawnItems(level, rooms, difficulty);

                return level;
            }

        }
        throw new Error("Critical Error: Failed to generate a valid map after 100 attempts.");
    }

    _placeRooms(level) {
        const GRID_ROWS = 3;
        const GRID_COLS = 3;
        const generatedRooms = [];

        const cellWidth = Math.floor(this.width / GRID_COLS);
        const cellHeight = Math.floor(this.height / GRID_ROWS);

        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                const cellX = col * cellWidth;
                const cellY = row * cellHeight;

                const roomWidth = 4 + Math.floor(Math.random() * (cellWidth - 6));
                const roomHeight = 4 + Math.floor(Math.random() * (cellHeight - 6));
                const roomX = cellX + 2 + Math.floor(Math.random() * (cellWidth - roomWidth - 4));
                const roomY = cellY + 2 + Math.floor(Math.random() * (cellHeight - roomHeight - 4));

                const room = new Room({x: roomX, y: roomY, width: roomWidth, height: roomHeight});

                level.rooms.push(room);
                generatedRooms.push(room);
                this._carveRoom(level, room);
            }
        }
        return generatedRooms;
    }

    _isMapConnected(level, rooms) {
        if (rooms.length === 0) return false;

        const startX = rooms[0].center.x;
        const startY = rooms[0].center.y;

        const visited = new Set();
        const queue = [{x: startX, y: startY}];
        visited.add(`${startX},${startY}`);

        let visitedTilesCount = 0;

        while (queue.length > 0) {
            const current = queue.shift();
            visitedTilesCount++;

            const neighbors = [
                {x: current.x + 1, y: current.y},
                {x: current.x - 1, y: current.y},
                {x: current.x, y: current.y + 1},
                {x: current.x, y: current.y - 1}
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < level.width && n.y >= 0 && n.y < level.height) {
                    const tile = level.getTile(n.x, n.y);
                    const key = `${n.x},${n.y}`;

                    if ((tile === 'floor' || tile === 'stairs') && !visited.has(key)) {
                        visited.add(key);
                        queue.push(n);
                    }
                }
            }
        }

        for (const room of rooms) {
            const key = `${room.center.x},${room.center.y}`;
            if (!visited.has(key)) {
                return false;
            }
        }

        return true;
    }

    _carveRoom(level, room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                level.setTile(x, y, 'floor');
            }
        }
    }

    _connectRooms(level, room) {
        for (let i = 0; i < room.length; i++) {
            const roomA = room[i];

            const row = Math.floor(i / 3);
            const col = i % 3;

            if (col < 2) {
                const roomB = room[i + 1];
                this._createTunnel(level, roomA.center, roomB.center);
            }

            if (row < 2) {
                const roomB = room[i + 3];
                this._createTunnel(level, roomA.center, roomB.center);
            }
        }
    }

    _createTunnel(level, pointA, pointB) {
        const isHorizontalFirst = Math.random() > 0.5;

        if (isHorizontalFirst) {
            this._drawHorizontalLine(level, pointA.x, pointB.x, pointA.y);
            this._drawVerticalLine(level, pointA.y, pointB.y, pointB.x);
        } else {
            this._drawVerticalLine(level, pointA.y, pointB.y, pointA.x);
            this._drawHorizontalLine(level, pointA.x, pointB.x, pointB.y);
        }
    }

    _drawHorizontalLine(level, x1, x2, y) {
        const start = Math.min(x1, x2);
        const end = Math.max(x1, x2);
        for (let x = start; x <= end; x++) {
            level.setTile(x, y, 'floor');
        }
    }

    _drawVerticalLine(level, y1, y2, x) {
        const start = Math.min(y1, y2);
        const end = Math.max(y1, y2);
        for (let y = start; y <= end; y++) {
            level.setTile(x, y, 'floor');
        }
    }

    _spawnEnemies(level, rooms, difficulty) {
        const types = ['zombie', 'ghost', 'vampire', 'ogre', 'snake'];

        const baseCount = 1 + Math.floor(difficulty / 3);
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];

            const count = baseCount + Math.floor(Math.random() * 2);

            for (let j = 0; j < count; j++) {
                const randomIndex = Math.floor(Math.random() * types.length);
                const type = types[randomIndex];

                let x, y, attempts = 0;
                let validPosition = false;

                while (!validPosition && attempts < 10) {
                    x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
                    y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

                    const isOccupied = level.monsters.some(m => m.x === x && m.y === y);

                    if (!isOccupied) {
                        validPosition = true;
                    }
                    attempts++;
                }

                if (validPosition) {
                    const enemy = new Enemy(type, x, y);
                    level.addEnemy(enemy);
                }
            }
        }
    }

    _spawnItems(level, rooms, difficulty) {
        const chance = Math.max(0.1, 0.8 - (difficulty * 0.035));

        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];

            if (Math.random() < chance) {
                const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
                const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));


                const hasMonster = level.monsters.some(m => m.x === x && m.y === y);
                const hasItem = level.items.some(it => it.x === x && it.y === y);

                if (!hasMonster && !hasItem) {
                    const template = Item.getRandomTemplate();
                    const item = new Item(template, x, y);
                    level.addItem(item);
                }
            }
        }
    }
}