import fs from 'node:fs';

const SAVE_FILE = './savegame.json';

export default class SaveService {
    static save(gameState) {
        try {
            fs.writeFileSync(SAVE_FILE, JSON.stringify(gameState, null, 2));
        } catch (e) {
            console.error("Failed to save game:", e);
        }
    }

    static load() {
        try {
            if (fs.existsSync(SAVE_FILE)) {
                const data = fs.readFileSync(SAVE_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to load save:", e);
        }
        return null;
    }

    static hasSave() {
        return fs.existsSync(SAVE_FILE);
    }

    static clearSave() {
        if (fs.existsSync(SAVE_FILE)) {
            fs.unlinkSync(SAVE_FILE);
        }
    }
}