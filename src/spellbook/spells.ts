import type { Localized } from '../engine/types';
import type { LevelId } from '../state/levels';

/**
 * The spell book: one spell per new SQL idea, in game order. A spell is learned when its level is
 * completed. The example always runs on the data of that level (tested), so it is real kingdom SQL.
 * SQL keywords and the example stay in English; descriptions and formula placeholders are translated.
 */
export interface Spell {
  id: string;
  level: LevelId;
  /** Spell name: the SQL keywords themselves (or a translated name for a technique). */
  name: Localized;
  what: Localized;
  /** General shape, with translated placeholders (table, column...). */
  formula: Localized;
  /** A query on the data of `level`. */
  example: string;
}

const same = (text: string): Localized => ({ es: text, en: text, fr: text });

export const SPELLS: Spell[] = [
  {
    id: 'select',
    level: 'easy-1',
    name: same('SELECT … FROM'),
    what: { es: 'Lee columnas de una tabla.', en: 'Reads columns from a table.', fr: 'Lit des colonnes d’une table.' },
    formula: { es: 'SELECT columna1, columna2 FROM tabla;', en: 'SELECT column1, column2 FROM table;', fr: 'SELECT colonne1, colonne2 FROM table;' },
    example: 'SELECT name, role FROM villagers;',
  },
  {
    id: 'where',
    level: 'easy-2',
    name: same('WHERE'),
    what: { es: 'Quédate solo con las filas que cumplen una condición.', en: 'Keeps only the rows that meet a condition.', fr: 'Ne garde que les lignes qui remplissent une condition.' },
    formula: { es: 'SELECT … FROM tabla WHERE condición;', en: 'SELECT … FROM table WHERE condition;', fr: 'SELECT … FROM table WHERE condition;' },
    example: "SELECT name FROM villagers WHERE role = 'archer';",
  },
  {
    id: 'and-or-in',
    level: 'easy-3',
    name: same('AND · OR · IN'),
    what: { es: 'Combina condiciones o compara con una lista.', en: 'Combines conditions or compares with a list.', fr: 'Combine des conditions ou compare à une liste.' },
    formula: same("WHERE a = 1 AND (b = 2 OR c IN ('x', 'y'))"),
    example: "SELECT name FROM villagers WHERE role = 'pawn' AND trade IN ('woodcutter', 'miner');",
  },
  {
    id: 'like',
    level: 'easy-4',
    name: same('LIKE'),
    what: { es: 'Busca textos con un patrón: % vale por cualquier texto.', en: 'Finds text matching a pattern: % stands for any text.', fr: 'Cherche des textes selon un motif : % remplace n’importe quel texte.' },
    formula: { es: "WHERE columna LIKE 'texto%'", en: "WHERE column LIKE 'text%'", fr: "WHERE colonne LIKE 'texte%'" },
    example: "SELECT name FROM sheep WHERE name LIKE 'Lan%';",
  },
  {
    id: 'order-by',
    level: 'easy-4',
    name: same('ORDER BY'),
    what: { es: 'Ordena el resultado; DESC va de mayor a menor.', en: 'Sorts the result; DESC goes from highest to lowest.', fr: 'Trie le résultat ; DESC va du plus grand au plus petit.' },
    formula: { es: 'ORDER BY columna DESC', en: 'ORDER BY column DESC', fr: 'ORDER BY colonne DESC' },
    example: 'SELECT name, last_seen_at FROM sheep ORDER BY last_seen_at DESC;',
  },
  {
    id: 'insert',
    level: 'easy-5',
    name: same('INSERT'),
    what: { es: 'Añade una fila nueva a una tabla.', en: 'Adds a new row to a table.', fr: 'Ajoute une nouvelle ligne à une table.' },
    formula: { es: 'INSERT INTO tabla (columnas) VALUES (valores);', en: 'INSERT INTO table (columns) VALUES (values);', fr: 'INSERT INTO table (colonnes) VALUES (valeurs);' },
    example: "INSERT INTO scribes (name, sworn_on) VALUES ('Pip', '1247-03-16');",
  },
  {
    id: 'update',
    level: 'easy-5',
    name: same('UPDATE'),
    what: { es: 'Cambia filas que ya existen. ¡No olvides el WHERE!', en: 'Changes rows that already exist. Do not forget the WHERE!', fr: 'Modifie des lignes existantes. N’oublie pas le WHERE !' },
    formula: { es: 'UPDATE tabla SET columna = valor WHERE condición;', en: 'UPDATE table SET column = value WHERE condition;', fr: 'UPDATE table SET colonne = valeur WHERE condition;' },
    example: "UPDATE houses SET status = 'rebuilt' WHERE status = 'rebuilding';",
  },
  {
    id: 'aggregates',
    level: 'medium-1',
    name: same('SUM · COUNT · AVG · MIN · MAX'),
    what: { es: 'Resume muchas filas en un solo valor.', en: 'Sums up many rows into a single value.', fr: 'Résume de nombreuses lignes en une seule valeur.' },
    formula: { es: 'SELECT SUM(columna) FROM tabla;', en: 'SELECT SUM(column) FROM table;', fr: 'SELECT SUM(colonne) FROM table;' },
    example: 'SELECT SUM(gold), SUM(wood), SUM(meat) FROM storehouses;',
  },
  {
    id: 'group-by',
    level: 'medium-2',
    name: same('GROUP BY'),
    what: { es: 'Agrupa filas y resume cada grupo por separado.', en: 'Groups rows and sums up each group separately.', fr: 'Regroupe les lignes et résume chaque groupe séparément.' },
    formula: { es: 'SELECT col, SUM(x) FROM tabla GROUP BY col;', en: 'SELECT col, SUM(x) FROM table GROUP BY col;', fr: 'SELECT col, SUM(x) FROM table GROUP BY col;' },
    example: 'SELECT village, SUM(gold) FROM storehouses GROUP BY village;',
  },
  {
    id: 'having',
    level: 'medium-3',
    name: same('HAVING'),
    what: { es: 'Filtra grupos después de resumirlos: WHERE filtra filas, HAVING filtra grupos.', en: 'Filters groups after summing them up: WHERE filters rows, HAVING filters groups.', fr: 'Filtre les groupes après les avoir résumés : WHERE filtre les lignes, HAVING les groupes.' },
    formula: same('… GROUP BY col HAVING SUM(x) > 100'),
    example: 'SELECT village, SUM(meat) FROM harvests GROUP BY village HAVING SUM(meat) > 150;',
  },
  {
    id: 'delete',
    level: 'medium-4',
    name: same('DELETE'),
    what: { es: 'Borra filas. Sin WHERE, ¡las borra todas!', en: 'Deletes rows. Without WHERE, it deletes them all!', fr: 'Supprime des lignes. Sans WHERE, il les supprime toutes !' },
    formula: { es: 'DELETE FROM tabla WHERE condición;', en: 'DELETE FROM table WHERE condition;', fr: 'DELETE FROM table WHERE condition;' },
    example: "DELETE FROM merchants WHERE seal = 'none';",
  },
  {
    id: 'join',
    level: 'medium-5',
    name: same('JOIN … ON'),
    what: { es: 'Une dos tablas por una columna que comparten.', en: 'Joins two tables on a column they share.', fr: 'Relie deux tables par une colonne qu’elles partagent.' },
    formula: same('SELECT … FROM a JOIN b ON a.col = b.col;'),
    example: 'SELECT towers.name, soldiers.name FROM towers JOIN soldiers ON towers.last_guard_id = soldiers.id;',
  },
  {
    id: 'joins-aliases',
    level: 'hard-1',
    name: { es: 'Varios JOIN y alias', en: 'Several JOINs and aliases', fr: 'Plusieurs JOIN et alias' },
    what: { es: 'Encadena varias tablas; un alias (l, g, c) acorta los nombres.', en: 'Chains several tables; an alias (l, g, c) shortens the names.', fr: 'Enchaîne plusieurs tables ; un alias (l, g, c) raccourcit les noms.' },
    formula: same('FROM a x JOIN b y ON … JOIN c z ON …'),
    example: 'SELECT g.name, c.name, l.item FROM loot l JOIN goblins g ON l.goblin_id = g.id JOIN camps c ON g.camp_id = c.id;',
  },
  {
    id: 'left-join',
    level: 'hard-2',
    name: same('LEFT JOIN · IS NULL'),
    what: { es: 'Mantiene todas las filas de la primera tabla; IS NULL encuentra las que no tienen pareja.', en: 'Keeps every row of the first table; IS NULL finds those without a match.', fr: 'Garde toutes les lignes de la première table ; IS NULL trouve celles sans correspondance.' },
    formula: same('FROM a LEFT JOIN b ON … WHERE b.id IS NULL'),
    example: 'SELECT s.item FROM stolen_goods s LEFT JOIN recoveries r ON r.stolen_id = s.id WHERE r.id IS NULL;',
  },
  {
    id: 'subquery-where',
    level: 'hard-3',
    name: { es: 'Subconsulta en WHERE', en: 'Subquery in WHERE', fr: 'Sous-requête dans WHERE' },
    what: { es: 'Usa el resultado de otra consulta dentro de la condición.', en: 'Uses the result of another query inside the condition.', fr: 'Utilise le résultat d’une autre requête dans la condition.' },
    formula: { es: 'WHERE col > (SELECT AVG(col) FROM tabla)', en: 'WHERE col > (SELECT AVG(col) FROM table)', fr: 'WHERE col > (SELECT AVG(col) FROM table)' },
    example: 'SELECT name FROM goblins WHERE loot_value > (SELECT AVG(loot_value) FROM goblins);',
  },
  {
    id: 'subquery-from',
    level: 'hard-4',
    name: { es: 'Subconsulta en FROM · LIMIT', en: 'Subquery in FROM · LIMIT', fr: 'Sous-requête dans FROM · LIMIT' },
    what: { es: 'Una consulta puede hacer de tabla (dale un nombre con AS); LIMIT se queda con las primeras filas.', en: 'A query can act as a table (name it with AS); LIMIT keeps the first rows.', fr: 'Une requête peut servir de table (nomme-la avec AS) ; LIMIT garde les premières lignes.' },
    formula: { es: 'SELECT MAX(total) FROM (SELECT SUM(x) AS total FROM tabla GROUP BY col);', en: 'SELECT MAX(total) FROM (SELECT SUM(x) AS total FROM table GROUP BY col);', fr: 'SELECT MAX(total) FROM (SELECT SUM(x) AS total FROM table GROUP BY col);' },
    example: "SELECT camp, SUM(quantity) AS tnt FROM supplies WHERE item = 'TNT' GROUP BY camp ORDER BY tnt DESC LIMIT 1;",
  },
];
