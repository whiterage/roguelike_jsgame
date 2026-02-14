import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Минимальный размер терминала (ширина x высота) */
export const MIN_TERMINAL_WIDTH = 100;
export const MIN_TERMINAL_HEIGHT = 30;

/** Отступы от размеров терминала для игрового поля */
export const TERMINAL_PADDING_X = 4;
export const TERMINAL_PADDING_Y = 6;

/** Размеры по умолчанию, если process.stdout не даёт размеры */
export const DEFAULT_WIDTH = 80;
export const DEFAULT_HEIGHT = 24;

/** Лимит предметов одного типа в инвентаре */
export const MAX_ITEMS_PER_TYPE = 9;

/** Количество уровней до победы */
export const MAX_LEVELS = 21;

/** Количество рекордов в таблице */
export const TOP_SCORES_LIMIT = 10;

/** Путь к файлу рекордов (рядом с исходниками) */
export const SCORES_FILE_PATH = path.join(__dirname, "scores.json");
