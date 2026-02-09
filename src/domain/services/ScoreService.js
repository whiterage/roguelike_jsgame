import fs from "fs";

const SCORE_FILE = './scores.json';

export default class ScoreService {
    constructor() {
        this._scores = this._loadScores();
    }

    addScore(level, gold) {
        this._scores.push({
            date: new Date().toISOString().split('T')[0],
            level: level,
            gold: gold,
        });

        this._scores.sort((a, b) => b.gold - a.gold);

        if (this._scores.length > 10) {
            this._scores = this._scores.slice(0, 10);
        }

        this._saveScores();
    }

    getTopScores() {
        return this._scores;
    }

    _loadScores() {
        try {
            if (fs.existsSync(SCORE_FILE)) {
                const data = fs.readFileSync(SCORE_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load scores:', e);
        }
        return [];
    }

    _saveScores() {
        try {
            fs.writeFileSync(SCORE_FILE, JSON.stringify(this._scores, null, 2));
        } catch (e) {
            console.error("Failed to save scores:", e);
        }
    }
}