import { describe, expect, it } from 'vitest';
import { loadSqlEngine } from './engine';

describe('SQL engine (sql.js)', () => {
  it('loads once and runs SQLite queries in memory', async () => {
    const SQL = await loadSqlEngine();
    expect(await loadSqlEngine()).toBe(SQL);

    const db = new SQL.Database();
    db.run("CREATE TABLE villagers (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO villagers (name) VALUES ('Pip'), ('Aldric');");
    const [result] = db.exec('SELECT name FROM villagers ORDER BY id');
    expect(result?.columns).toEqual(['name']);
    expect(result?.values).toEqual([['Pip'], ['Aldric']]);
    db.close();
  });
});
