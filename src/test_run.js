import MapGenerator from './domain/logic/MapGenerator.js';

const generator = new MapGenerator(60, 20);
const level = generator.generate();

console.log(`Карта создана 60x20.`);
console.log(`Старт игрока:`, level.startPoint);
console.log(`Выход с уровня:`, level.stairsDown);

// Возьмем две соседние комнаты (0 и 1)
const room1 = level.rooms[0];
const room2 = level.rooms[1];

console.log(`Комната 1 центр:`, room1.center);
console.log(`Комната 2 центр:`, room2.center);

// Проверим точку посередине между ними по X (примерно там должен быть коридор)
const midX = Math.floor((room1.center.x + room2.center.x) / 2);
// Если коридор Г-образный, то проверка сложнее, но давай просто выведем тайл
// в точке, где горизонтальный туннель должен соединяться
const tileAtMid = level.getTile(midX, room1.center.y);
console.log(`Тайл между комнатами (по Y первой комнаты): '${tileAtMid}'`);

if (tileAtMid === 'floor') {
    console.log("SUCCESS: Похоже, коридор есть!");
} else {
    console.log("NOTE: Может быть коридор пошел по другой траектории (сначала верт, потом гор).");
}