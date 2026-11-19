# The Kingdom of Records

*The Chronicles of the Registry* — a pixel-art web game to learn SQL. Runs fully in the browser
(SQLite compiled to WebAssembly via sql.js); no backend.

## Requirements

- Node.js 20.19+ (developed with Node 26 LTS) and npm.

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
docs/              Asset inventory, story, level file format, design references
public/assets/     Cleaned copies of the art used by the game + CREDITS.md and licences
src/
  db/              sql.js loader
  engine/          SQL runner, answer validation, friendly errors, Web Worker client
  levels/          One JSON file per level + loader and content tests
  i18n/            Translations: es.json, en.json, fr.json
  state/           Levels, progress and settings (persisted in localStorage)
  styles/          Global CSS
  ui/              Screens and components
  main.ts          Entry point
```

The original asset packs live at the repository root for reference only. They are never modified and
are not tracked by git.

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

## Credits

See [`public/assets/CREDITS.md`](public/assets/CREDITS.md).
