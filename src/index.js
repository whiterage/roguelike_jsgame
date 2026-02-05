import Renderer from "./presentation/Renderer.js";
import Game from "./Game.js";
import InputHandler from "./presentation/InputHandler.js";

const game = new Game();
const renderer = new Renderer();
const input = new InputHandler(game, renderer);

renderer.draw(game.level, game.hero, game.levelCounter);


renderer.onInput((key) => {
    input.handleKey(key);
});