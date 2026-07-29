# Roguelike

A terminal roguelike in JavaScript — 21 procedurally generated levels, five enemy types with
distinct behavior, key-and-door puzzles, fog of war, and a save file that survives a `Ctrl+C`.

## Quick start

Requires Node.js 18 or newer, and a terminal at least 100×30.

```bash
git clone https://github.com/whiterage/roguelike_jsgame.git
cd roguelike_jsgame
npm install
node src/index.js
```

## Controls

| Keys | Does |
| --- | --- |
| `w` `a` `s` `d` | Move / attack in that direction |
| `h` | Equip or unequip a weapon |
| `j` | Eat food |
| `k` | Drink an elixir |
| `e` | Read a scroll |
| `q` / `Esc` | Save and quit |

## What's actually there

**Level generation** places rooms on a 3×3 grid, connects them, and regenerates from scratch
(up to 100 attempts) if the result isn't fully reachable. Up to two colour-locked doors get placed
along the path from start to stairs, with the matching key in the room just before each door. A
BFS then re-checks that the stairs are still reachable with the keys as placed; if a door would
soft-lock the level, both the door and its key are stripped back out rather than shipping a level
you can't finish.

**Five enemies, five behaviors** — this is the part with the most design in it:

| Enemy | What makes it different |
| --- | --- |
| Zombie | Baseline: walks straight at you |
| Vampire | Dodges your first hit for free, heals on damage dealt, drains max HP |
| Ghost | Ignores walls, flickers between visible and invisible, occasionally teleports |
| Ogre | Hits hard, then rests a turn before it can attack again |
| Snake | Moves diagonally, has a chance to put you to sleep on hit |

Combat itself is a hit-chance roll from both sides' agility, not a flat "always connects."

**Fog of war** tracks visible tiles separately from ever-explored tiles, so the map fills in
permanently as you go but only the area around you is lit at any moment.

**Saves** are automatic on every level transition and on quit, and are offered back to you on the
next launch. Death and victory both write to a local high-score table (gold, level reached,
kills, date).

## Project layout

```
src/
  index.js                    terminal-size check, save-prompt, boot
  Game.js                     game loop: input → combat → state → render
  config.js                   terminal sizing, level count, inventory limits
  domain/
    entities/                 Character, Enemy, Item, Level, Room
    logic/
      MapGenerator.js          room placement, connectivity check, doors/keys, spawns
      FogOfWar.js               visible vs. explored tile tracking
    services/
      SaveService.js            save/load to disk
      ScoreService.js            high-score table
  presentation/
    Renderer.js                blessed-based terminal rendering
    InputHandler.js             keypress → Game.processInput
```

Domain logic has no dependency on the rendering layer — `MapGenerator`, `Enemy`, and combat
resolution are plain JavaScript, and `Renderer` is the only file that touches
[blessed](https://github.com/chjj/blessed).
