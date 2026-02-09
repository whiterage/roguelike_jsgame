export default class InputHandler {
    constructor(game, renderer) {
        this.game = game;
        this.renderer = renderer;
    }

    handleKey(key) {
        this.game.processInput(key);

        this.renderer.draw(this.game);
    }
}