import Renderer from "./presentation/Renderer.js";
import Game from "./Game.js";

const game = new Game();
const renderer = new Renderer();

renderer.draw(game.level, game.hero, game.levelCounter);

renderer.onInput((key) => {
    game.processInput(key);
    renderer.setTitle(`Rogue JS - Level ${game.levelCounter}`);
    renderer.draw(game.level, game.hero, game.levelCounter);
});