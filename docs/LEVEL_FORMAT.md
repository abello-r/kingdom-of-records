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

Texts may mark code with backticks (`` `role = 'archer'` ``); the UI shows it in the code font. A test
checks that backticks are balanced in every text.

Writing rules: a level never requires a concept that has not been introduced in an earlier level or in
its own narrative/hints; hints go from vague to almost the answer; the player is addressed without
gender in ES and FR. Story facts quoted in texts (totals, names) must match what the solution returns.
Table and column names must not be SQLite keywords (checked by `src/ui/sql-dialect.test.ts`).

## How attempts are checked

The database is rebuilt from `setup` before **every** attempt, so the player's SQL always starts from
the same data. All statements in the editor run in order.

| `check` | Compared | Notes |
|---|---|---|
| `{ "mode": "result" }` | Last result set of the player vs. the solution: columns + rows | Row order ignored. Column names compared ignoring case, spaces and quotes; columns in a different order are accepted. |
| `{ "mode": "result", "orderMatters": true }` | Same, and rows must be in the same order | For `ORDER BY` levels. Seed data must not have ties on the sort key, or several orders would be valid. |
| `{ "mode": "result", "ignoreColumnNames": true }` | Columns by position only | For aggregates when the task does not ask for an alias. |
| `{ "mode": "state", "tables": ["houses"] }` | Final rows of the listed tables after the player's SQL vs. after the solution | For `INSERT` / `UPDATE` / `DELETE`. Row order ignored; table columns must not change. |

### Hidden data (`variants`)

`"variants": ["CREATE TABLE …; INSERT …;"]` lists extra setup scripts with **the same tables and
columns** but different values. The player never sees them. An attempt that is right on the visible
data is run again on every variant and must also match the solution there; otherwise it is rejected
with `mismatch.hiddenData` ("don't copy values from the results"). This catches hardcoded answers such
as `WHERE loot_value > 100` instead of comparing with `AVG`, `WHERE name IN (...)` copied from the
results, or `UPDATE … WHERE id IN (1, 4, 6, 8)`.

Rules (enforced by `src/levels/levels.test.ts`): every level has at least one variant unless it is
listed in `NO_VARIANTS` with a reason (only `easy-1`, which returns every row unfiltered); each variant
has exactly the same schema as the visible data; its expected answer differs from the visible one and is
not empty. For `orderMatters` levels and "top 1" levels, variants must have no ties.

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
