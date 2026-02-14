import fs from "fs";
import { SCORES_FILE_PATH, TOP_SCORES_LIMIT } from "../../config.js";

/**
 * @param {Object} stats - объект статистики с полями level, gold и опционально остальными
 * @param {number} stats.level
 * @param {number} stats.gold
 */
export default class ScoreService {
    constructor() {
        this._scores = this._loadScores();
    }

    addScore(stats) {
        const record = {
            date: new Date().toISOString().split("T")[0],
            level: stats.level,
            gold: stats.gold ?? 0,
            enemiesKilled: stats.enemiesKilled ?? 0,
            foodEaten: stats.foodEaten ?? 0,
            elixirsDrank: stats.elixirsDrank ?? 0,
            scrollsRead: stats.scrollsRead ?? 0,
            damageDealt: stats.damageDealt ?? 0,
            damageTaken: stats.damageTaken ?? 0,
            stepsTaken: stats.stepsTaken ?? 0,
            itemsPicked: stats.itemsPicked ?? 0,
        };

        this._scores.push(record);
        this._scores.sort((a, b) => (b.gold ?? 0) - (a.gold ?? 0));

        if (this._scores.length > TOP_SCORES_LIMIT) {
            this._scores = this._scores.slice(0, TOP_SCORES_LIMIT);
        }

        this._saveScores();
    }

    getTopScores() {
        return this._scores;
    }

    _loadScores() {
        try {
            if (fs.existsSync(SCORES_FILE_PATH)) {
                const data = fs.readFileSync(SCORES_FILE_PATH, "utf8");
                const parsed = JSON.parse(data);
                return Array.isArray(parsed)
                    ? parsed.map((entry) => this._normalizeRecord(entry))
                    : [];
            }
        } catch (e) {
            console.error("Failed to load scores:", e);
        }
        return [];
    }

    _normalizeRecord(entry) {
        if (entry && typeof entry.level === "number" && typeof entry.gold === "number") {
            return entry;
        }
        if (entry && typeof entry === "object" && entry.level && typeof entry.level === "object") {
            const inner = entry.level;
            return {
                date: entry.date ?? new Date().toISOString().split("T")[0],
                level: inner.level ?? 1,
                gold: inner.gold ?? 0,
                enemiesKilled: inner.enemiesKilled ?? 0,
                foodEaten: inner.foodEaten ?? 0,
                elixirsDrank: inner.elixirsDrank ?? 0,
                scrollsRead: inner.scrollsRead ?? 0,
                damageDealt: inner.damageDealt ?? 0,
                damageTaken: inner.damageTaken ?? 0,
                stepsTaken: inner.stepsTaken ?? 0,
                itemsPicked: inner.itemsPicked ?? 0,
            };
        }
        return {
            date: entry?.date ?? new Date().toISOString().split("T")[0],
            level: 1,
            gold: 0,
            enemiesKilled: 0,
            foodEaten: 0,
            elixirsDrank: 0,
            scrollsRead: 0,
            damageDealt: 0,
            damageTaken: 0,
            stepsTaken: 0,
            itemsPicked: 0,
        };
    }

    _saveScores() {
        try {
            fs.writeFileSync(SCORES_FILE_PATH, JSON.stringify(this._scores, null, 2));
        } catch (e) {
            console.error("Failed to save scores:", e);
        }
    }
}
