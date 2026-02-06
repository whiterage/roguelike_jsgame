const MIN_WIDTH = 100;
const MIN_HEIGHT = 30;

if (process.stdout.columns < MIN_WIDTH || process.stdout.rows < MIN_HEIGHT) {
    console.log('\x1b[31m'); // Красный цвет
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                   WINDOW TOO SMALL                   ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║                                                      ║');
    console.log(`║   Current size: ${process.stdout.columns}x${process.stdout.rows}                                  ║`);
    console.log(`║   Required:     ${MIN_WIDTH}x${MIN_HEIGHT}                                  ║`);
    console.log('║                                                      ║');
    console.log('║   Please resize your terminal window and restart.    ║');
    console.log('║                                                      ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('\x1b[0m'); // Сброс цвета
    process.exit(1);
}

import Renderer from "./presentation/Renderer.js";
import Game from "./Game.js";
import InputHandler from "./presentation/InputHandler.js";

const game = new Game();
const renderer = new Renderer();
const input = new InputHandler(game, renderer);

renderer.draw(game.level, game.hero, game.levelCounter, game.log);


renderer.onInput((key) => {
    input.handleKey(key);
});