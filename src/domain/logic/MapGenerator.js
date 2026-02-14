import Level, { DOOR_COLORS } from "../entities/Level.js";
import Room from "../entities/Room.js";
import Enemy from "../entities/Enemy.js";
import Item from "../entities/Item.js";
import { ITEM_TYPES } from "../entities/Item.js";

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

            const segments = this._connectRooms(level, rooms);

            level.startPoint = rooms[0].center;
            level.stairsDown = rooms[rooms.length - 1].center;
            level.setTile(level.stairsDown.x, level.stairsDown.y, 'stairs');

            if (this._isMapConnected(level, rooms)) {
                this._placeDoorsAndKeys(level, rooms, segments);
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

    _connectRooms(level, rooms) {
        const segments = [];
        for (let i = 0; i < rooms.length; i++) {
            const roomA = rooms[i];
            const row = Math.floor(i / 3);
            const col = i % 3;

            if (col < 2) {
                const roomB = rooms[i + 1];
                const cells = this._createTunnel(level, roomA.center, roomB.center);
                segments.push({ roomA: i, roomB: i + 1, cells });
            }
            if (row < 2) {
                const roomB = rooms[i + 3];
                const cells = this._createTunnel(level, roomA.center, roomB.center);
                segments.push({ roomA: i, roomB: i + 3, cells });
            }
        }
        return segments;
    }

    _createTunnel(level, pointA, pointB) {
        const cells = [];
        const isHorizontalFirst = Math.random() > 0.5;

        if (isHorizontalFirst) {
            this._drawHorizontalLine(level, pointA.x, pointB.x, pointA.y, cells);
            this._drawVerticalLine(level, pointA.y, pointB.y, pointB.x, cells);
        } else {
            this._drawVerticalLine(level, pointA.y, pointB.y, pointA.x, cells);
            this._drawHorizontalLine(level, pointA.x, pointB.x, pointB.y, cells);
        }
        return cells;
    }

    _drawHorizontalLine(level, x1, x2, y, cells) {
        const start = Math.min(x1, x2);
        const end = Math.max(x1, x2);
        for (let x = start; x <= end; x++) {
            level.setTile(x, y, 'floor');
            if (cells) cells.push({ x, y });
        }
    }

    _drawVerticalLine(level, y1, y2, x, cells) {
        const start = Math.min(y1, y2);
        const end = Math.max(y1, y2);
        for (let y = start; y <= end; y++) {
            level.setTile(x, y, 'floor');
            if (cells) cells.push({ x, y });
        }
    }

    /** Граф комнат: 9 узлов (0..8), рёбра по сетке 3x3 */
    _buildRoomGraph() {
        const graph = Array.from({ length: 9 }, () => []);
        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            if (col < 2) graph[i].push(i + 1);
            if (col > 0) graph[i].push(i - 1);
            if (row < 2) graph[i].push(i + 3);
            if (row > 0) graph[i].push(i - 3);
        }
        return graph;
    }

    /** BFS от старта (0) до выхода (8) — возвращает путь по комнатам */
    _pathFromStartToStairs(graph) {
        const queue = [[0]];
        const visited = new Set([0]);
        while (queue.length > 0) {
            const path = queue.shift();
            const room = path[path.length - 1];
            if (room === 8) return path;
            for (const next of graph[room]) {
                if (visited.has(next)) continue;
                visited.add(next);
                queue.push([...path, next]);
            }
        }
        return null;
    }

    /** Размещение дверей и ключей; проверка достижимости через BFS с учётом ключей */
    _placeDoorsAndKeys(level, rooms, segments) {
        const graph = this._buildRoomGraph();
        const path = this._pathFromStartToStairs(graph);
        if (!path || path.length < 2) return;

        const edgesOnPath = new Set();
        for (let i = 0; i < path.length - 1; i++) {
            const a = Math.min(path[i], path[i + 1]);
            const b = Math.max(path[i], path[i + 1]);
            edgesOnPath.add(`${a}-${b}`);
        }

        const segmentByEdge = new Map();
        for (const seg of segments) {
            const key = `${Math.min(seg.roomA, seg.roomB)}-${Math.max(seg.roomA, seg.roomB)}`;
            segmentByEdge.set(key, seg);
        }

        const numDoors = Math.min(2, path.length - 1, DOOR_COLORS.length);
        const step = Math.max(1, Math.floor((path.length - 1) / (numDoors + 1)));
        const doorsToPlace = [];
        for (let d = 0; d < numDoors; d++) {
            const idx = Math.min(step * (d + 1), path.length - 2);
            const roomA = path[idx];
            const roomB = path[idx + 1];
            const key = `${Math.min(roomA, roomB)}-${Math.max(roomA, roomB)}`;
            const seg = segmentByEdge.get(key);
            if (seg && seg.cells.length > 0) {
                const color = DOOR_COLORS[d % DOOR_COLORS.length];
                const doorCell = seg.cells[Math.min(1, seg.cells.length - 1)];
                doorsToPlace.push({ roomA, roomB, color, doorCell, keyRoom: roomA });
            }
        }

        for (const { color, doorCell, keyRoom } of doorsToPlace) {
            level.doors.push({ x: doorCell.x, y: doorCell.y, color });
            const room = rooms[keyRoom];
            const keyPos = this._freeCellInRoom(level, room);
            if (keyPos) {
                const keyItem = new Item(
                    { type: ITEM_TYPES.KEY, name: `${color.charAt(0).toUpperCase() + color.slice(1)} Key`, symbol: '¶', color, keyColor: color },
                    keyPos.x, keyPos.y
                );
                level.addItem(keyItem);
            }
        }

        if (!this._isReachableWithKeys(level)) {
            level.doors.length = 0;
            const keysToRemove = level.items.filter(i => i.type === ITEM_TYPES.KEY);
            keysToRemove.forEach(k => level.removeItem(k));
        }
    }

    _freeCellInRoom(level, room) {
        const attempts = 50;
        for (let a = 0; a < attempts; a++) {
            const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
            if (level.getTile(x, y) !== 'floor') continue;
            const hasDoor = level.doors.some(d => d.x === x && d.y === y);
            const hasMonster = level.monsters.some(m => m.x === x && m.y === y);
            const hasItem = level.items.some(it => it.x === x && it.y === y);
            if (!hasDoor && !hasMonster && !hasItem) return { x, y };
        }
        return null;
    }

    /** BFS от старта до лестницы с учётом дверей и ключей (проверка на софтлок) */
    _isReachableWithKeys(level) {
        const start = level.startPoint;
        const stairs = level.stairsDown;
        const doors = level.doors;
        const keyItems = level.items.filter(i => i.type === ITEM_TYPES.KEY);

        const doorAt = (x, y) => doors.find(d => d.x === x && d.y === y);
        const keyAt = (x, y) => keyItems.find(k => k.x === x && k.y === y);

        const keySignature = (keys) => [...keys].sort().join(',');
        const visited = new Map();

        const queue = [{ x: start.x, y: start.y, keys: new Set() }];
        visited.set(keySignature(queue[0].keys), new Set([`${start.x},${start.y}`]));

        while (queue.length > 0) {
            const { x, y, keys } = queue.shift();
            if (x === stairs.x && y === stairs.y) return true;

            const sig = keySignature(keys);
            const neighbors = [
                { x: x + 1, y }, { x: x - 1, y },
                { x, y: y + 1 }, { x, y: y - 1 }
            ];

            for (const n of neighbors) {
                if (n.x < 0 || n.x >= level.width || n.y < 0 || n.y >= level.height) continue;
                const tile = level.getTile(n.x, n.y);
                if (tile !== 'floor' && tile !== 'stairs') continue;

                const door = doorAt(n.x, n.y);
                if (door && !keys.has(door.color)) continue;

                const key = keyAt(n.x, n.y);
                const newKeys = key ? new Set([...keys, key.keyColor]) : keys;
                const newSig = keySignature(newKeys);
                const visitedCells = visited.get(newSig) || new Set();
                const cellKey = `${n.x},${n.y}`;
                if (visitedCells.has(cellKey)) continue;
                visitedCells.add(cellKey);
                visited.set(newSig, visitedCells);
                queue.push({ x: n.x, y: n.y, keys: newKeys });
            }
        }
        return false;
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
                const hasDoor = level.doors.some(d => d.x === x && d.y === y);

                if (!hasMonster && !hasItem && !hasDoor) {
                    const template = Item.getRandomTemplate();
                    const item = new Item(template, x, y);
                    level.addItem(item);
                }
            }
        }
    }
}