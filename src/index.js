import {MIN_TERMINAL_WIDTH, MIN_TERMINAL_HEIGHT} from "./config.js";

if (process.stdout.columns < MIN_TERMINAL_WIDTH || process.stdout.rows < MIN_TERMINAL_HEIGHT) {
    console.log('\x1b[31m');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                   WINDOW TOO SMALL                   ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║                                                      ║');
    console.log(`║   Current size: ${process.stdout.columns}x${process.stdout.rows}                                  ║`);
    console.log(`║   Required:     ${MIN_TERMINAL_WIDTH}x${MIN_TERMINAL_HEIGHT}                                  ║`);
    console.log('║                                                      ║');
    console.log('║   Please resize your terminal window and restart.    ║');
    console.log('║                                                      ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('\x1b[0m');
    process.exit(1);
}

import readline from 'readline';
import Game from './Game.js';
import Renderer from './presentation/Renderer.js';
import InputHandler from './presentation/InputHandler.js';
import SaveService from './domain/services/SaveService.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function bootGame(loadFromSave) {
    const game = new Game();

    if (loadFromSave) {
        const savedData = SaveService.load();
        if (savedData) {
            game.loadGameState(savedData);
        }
    }

    const renderer = new Renderer();
    const inputHandler = new InputHandler(game, renderer);

    renderer.draw(game);

    renderer.onInput((key) => {
        inputHandler.handleKey(key);
    });
}

if (SaveService.hasSave()) {
    console.clear();
    console.log("===================================");
    console.log(" 💾 SAVED GAME FOUND");
    console.log("===================================");
    rl.question("Do you want to continue your previous journey? (Y/n): ", (answer) => {
        rl.close();
        const loadFromSave = answer.trim().toLowerCase() !== 'n';
        bootGame(loadFromSave);
    });
} else {
    rl.close();
    bootGame(false);
}