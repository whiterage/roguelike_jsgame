export default class InputHandler {
    constructor(game, renderer) {
        this.game = game;
        this.renderer = renderer;
        this.isInventoryOpen = false;

        this.lastLevel = 1;
    }

    handleKey(key) {
        if (key === 'i') {
            this.isInventoryOpen = this.renderer.toggleInventory(this.game.hero);
            return;
        }

        if (this.isInventoryOpen) {
            const index = parseInt(key) - 1;

            if (!isNaN(index) && index >= 0 && index < 9) {
                this.game.useItem(index);
                this.renderer._renderInventoryContent(this.game.hero);
                this.renderer.screen.render();
                this.renderer.draw(this.game.level, this.game.hero, this.game.levelCounter, this.game.log);
            }
            return;
        }

        if (['w', 'a', 's', 'd'].includes(key)) {
            const wasAlive = this.game.hero.hp > 0;

            this.game.processInput(key);

            this.renderer.setTitle(`Rogue JS - Level ${this.game.levelCounter}`);
            this.renderer.draw(this.game.level, this.game.hero, this.game.levelCounter, this.game.log);

            if (wasAlive && this.game.hero.hp <= 0) {
                this.renderer.showAlert('{bold}Y O U  D I E{/bold}', 3000);
            }
            if (this.game.levelCounter > this.lastLevel) {
                this.lastLevel = this.game.levelCounter;
                this.renderer.showAlert(`LEVEL ${this.game.levelCounter}`, 2000);
            }
        }
    }
}