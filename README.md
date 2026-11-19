# The Kingdom of Records

*The Chronicles of the Registry* — a pixel-art web game to learn SQL. Runs fully in the browser
(SQLite compiled to WebAssembly via sql.js); no backend.

## Requirements

- Node.js 20.19+ (developed with Node 26 LTS) and npm.
- Only to regenerate the game art: Python 3 with Pillow (see *Assets* below).

## Getting started

```bash
npm install
npm run dev        # development server at http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Type-checks and builds the static site into `dist/`. |
| `npm run preview` | Serves the production build locally. |
| `npm test` | Runs the unit tests (Vitest). |
| `npm run typecheck` | Type-checks without building. |

The build output in `dist/` is a static site and can be served from any static host or sub-folder.

## Project layout

```
docs/              Asset inventory, story, level file format, design references and mock-ups
public/assets/     Art used by the game (generated) + CREDITS.md and licences
scripts/           build_assets.py: copies the art from the original packs
src/
  app/             App shell, hash router (#/, #/map, #/level/easy-2), shared context
  db/              sql.js loader
  engine/          SQL runner, answer validation, friendly errors, notices, Web Worker client
  levels/          One JSON file per level + loader and content tests
  i18n/            Translations: es.json, en.json, fr.json
  state/           Levels, progress, settings, hints and drafts (localStorage)
  styles/          Global CSS
  ui/              Screens (home, map, level), dioramas, SQL editor (CodeMirror), controls
  main.ts          Entry point
```

The original asset packs live at the repository root for reference only. They are never modified and
are not tracked by git.

## Screens

- **Title screen** — continue where you left off, or open the map.
- **Kingdom map** — one island per stage, a standard per level (done, next, locked).
- **Level** — the Great Registry open on a lectern: story, task, hints and tables on the left; the SQL
  editor (highlighting, table/column autocompletion, `Ctrl`/`Cmd` + `Enter`) and the Registry's answer
  on the right; a diorama of the region above it that celebrates correct answers.

The level screen and the editor are loaded on demand, so the title screen and the map open quickly.

## Assets

`python scripts/build_assets.py` copies the art the game uses from the original packs (kept at the
repository root, never modified, not tracked by git) into `public/assets/`, with clean names. The
output is committed, so this is only needed when the list of assets changes.

## SQL engine

Player queries run in SQLite (sql.js) inside a Web Worker, on a database rebuilt from the level data
before every attempt; queries running longer than 3 seconds are stopped. How answers are checked and
how to write a level: [`docs/LEVEL_FORMAT.md`](docs/LEVEL_FORMAT.md).

## Languages

Spanish, English and French. Texts live in `src/i18n/*.json`; a test checks that the three files
have the same keys and placeholders. The language selector is always visible in the top bar.

## Saved data

Stored in the browser's `localStorage`:

- `kor.progress.v1` — completed levels.
- `kor.settings.v1` — language and mute preference.
- `kor.hints.v1` — hints revealed per level.
- `kor.drafts.v1` — the SQL being written in each level.

## Credits

See [`public/assets/CREDITS.md`](public/assets/CREDITS.md).
