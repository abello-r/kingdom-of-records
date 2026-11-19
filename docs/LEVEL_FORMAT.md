# Level file format

One JSON file per level in `/src/levels/{stage}-{n}.json` (e.g. `easy-1.json`). Files are checked when
the game loads and by the test suite (`src/levels/levels.test.ts`). The TypeScript definition is
`Level` in `src/engine/types.ts`.

```jsonc
{
  "id": "easy-2",                    // must equal the file name and "{stage}-{order}"
  "stage": "easy",                   // easy | medium | hard
  "order": 2,                        // 1–5
  "concepts": ["WHERE"],
  "title":     { "es": "…", "en": "…", "fr": "…" },
  "narrative": [ { "speaker": "aldric", "text": { "es": "…", "en": "…", "fr": "…" } } ],
  "task":      { "es": "…", "en": "…", "fr": "…" },   // the plain instruction
  "hints": [ {…}, {…}, {…} ],        // exactly 3, from gentle to almost the answer
  "success":   [ { "speaker": "aldric", "text": {…} } ],
  "setup": "CREATE TABLE …; INSERT INTO …;",           // run on a fresh database before every attempt
  "solution": "SELECT name FROM villagers WHERE role = 'archer';",
  "check": { "mode": "result" },
  "examples": {                      // optional, tests only
    "accepted": ["SELECT name FROM villagers WHERE role IN ('archer')"],
    "rejected": ["SELECT name FROM villagers"]
  }
}
```

Speakers: `narrator`, `aldric`, `scribe`, `garrick`, `corvin`, `grubnak`.

## How attempts are checked

The database is rebuilt from `setup` before **every** attempt, so the player's SQL always starts from
the same data. All statements in the editor run in order.

| `check` | Compared | Notes |
|---|---|---|
| `{ "mode": "result" }` | Last result set of the player vs. the solution: columns + rows | Row order ignored. Column names compared ignoring case, spaces and quotes; columns in a different order are accepted. |
| `{ "mode": "result", "orderMatters": true }` | Same, and rows must be in the same order | For `ORDER BY` levels. Seed data must not have ties on the sort key, or several orders would be valid. |
| `{ "mode": "result", "ignoreColumnNames": true }` | Columns by position only | For aggregates when the task does not ask for an alias. |
| `{ "mode": "state", "tables": ["houses"] }` | Final rows of the listed tables after the player's SQL vs. after the solution | For `INSERT` / `UPDATE` / `DELETE`. Row order ignored; table columns must not change. |

Numbers are compared by value (`5` equals `5.0`, floats with 12 significant digits); a number is
never equal to a text (`5` ≠ `'5'`).

## Safety

Player SQL runs in a Web Worker. A query that runs longer than 3 seconds (e.g. an endless recursive
CTE) is stopped and reported as a friendly `timeout` error; the page never freezes.

## Error messages

SQLite errors are mapped to translated messages (`sqlErrors.*` in `src/i18n/*.json`) with optional
tips: keyword typos (`SELEC` → "Did you mean SELECT?"), unquoted text (`role = archer` → use
`'archer'`) and unclosed quotes. Wrong answers are explained with `mismatch.*` messages (wrong
column count, wrong rows, wrong order, table not as expected…).
