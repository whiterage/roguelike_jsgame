export default class InputHandler {
    constructor(game, renderer) {
        this.game = game;
        this.renderer = renderer;
    }

    handleKey(key) {
        if (['escape', 'q', 'C-c'].includes(key)) {
            this.game.quitAndSave();
            return;
        }

        this.game.processInput(key);
        this.renderer.draw(this.game);
    }
}