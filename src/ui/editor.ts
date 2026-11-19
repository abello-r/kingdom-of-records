import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { sql } from '@codemirror/lang-sql';
import { HighlightStyle, bracketMatching, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { Compartment, EditorState, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  keymap,
  lineNumbers,
  placeholder,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import type { SchemaTable } from '../engine/runner';
import { levelDialect } from './sql-dialect';

/** Ink colours of the Registry (see docs/design/README.md). */
const inks = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword], color: '#2e5f8a' },
  { tag: [t.string, t.special(t.string)], color: '#9b3b2e' },
  { tag: [t.number, t.bool, t.null], color: '#4f7a28' },
  { tag: t.comment, color: '#7a6c55' },
  { tag: [t.name, t.propertyName], color: '#161c2e' },
]);

const parchmentTheme = EditorView.theme({
  '&': { backgroundColor: '#f7efdc', color: '#161c2e', fontSize: '18px' },
  '.cm-content': { fontFamily: "'JetBrains Mono', ui-monospace, monospace", caretColor: '#161c2e', padding: '8px 0' },
  '.cm-gutters': { backgroundColor: '#e2cfa7', color: '#7a6c55', border: 'none', borderRight: '2px solid rgba(22,28,46,.25)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(65,145,157,.35)' },
  '.cm-cursor': { borderLeftColor: '#161c2e', borderLeftWidth: '2px' },
  '.cm-placeholder': { color: '#7a6c55' },
  '.cm-tooltip-autocomplete': { fontFamily: "'JetBrains Mono', monospace", border: '3px solid #161c2e', backgroundColor: '#f7efdc' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#41919d', color: '#161c2e' },
  // The level's own tables and columns get their own ink, distinct from keywords (blue) and texts (brick).
  '.cm-sql-name, .cm-sql-name *': { color: '#7a3d78' },
  '.cm-sql-name.cm-sql-table': { textDecoration: 'underline dotted', textUnderlineOffset: '4px' },
});

/** Marks identifiers that are tables or columns of the level, from the syntax tree (never in strings). */
function schemaNames(tables: SchemaTable[]) {
  const tableNames = new Set(tables.map((t) => t.name.toLowerCase()));
  const columnNames = new Set(tables.flatMap((t) => t.columns.map((c) => c.name.toLowerCase())));
  const tableMark = Decoration.mark({ class: 'cm-sql-name cm-sql-table' });
  const columnMark = Decoration.mark({ class: 'cm-sql-name cm-sql-column' });
  const build = (view: EditorView): DecorationSet => {
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter: (node) => {
          if (node.name !== 'Identifier' && node.name !== 'QuotedIdentifier') return;
          let word = view.state.sliceDoc(node.from, node.to).toLowerCase();
          if (node.name === 'QuotedIdentifier') word = word.slice(1, -1);
          if (tableNames.has(word)) builder.add(node.from, node.to, tableMark);
          else if (columnNames.has(word)) builder.add(node.from, node.to, columnMark);
        },
      });
    }
    return builder.finish();
  };
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = build(view);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) this.decorations = build(u.view);
      }
    },
    { decorations: (v) => v.decorations },
  );
}

export interface SqlEditor {
  view: EditorView;
  getValue(): string;
  setValue(text: string): void;
  setSchema(tables: SchemaTable[]): void;
  setPlaceholder(text: string): void;
  setLabel(text: string): void;
  focus(): void;
  destroy(): void;
}

export interface EditorOptions {
  parent: HTMLElement;
  doc: string;
  label: string;
  placeholderText: string;
  onRun: () => void;
  onChange: (text: string) => void;
}

/** SQL support for one level: real SQLite keywords, schema autocompletion and schema-name highlighting. */
function sqlConfig(tables: SchemaTable[]) {
  const schema = Object.fromEntries(tables.map((tb) => [tb.name, tb.columns.map((c) => c.name)]));
  const names = tables.flatMap((tb) => [tb.name, ...tb.columns.map((c) => c.name)]);
  return [sql({ dialect: levelDialect(names), schema, upperCaseKeywords: true }), schemaNames(tables)];
}

export function createSqlEditor(opts: EditorOptions): SqlEditor {
  const language = new Compartment();
  const hint = new Compartment();
  const label = new Compartment();
  const run = () => {
    opts.onRun();
    return true;
  };

  const view = new EditorView({
    parent: opts.parent,
    state: EditorState.create({
      doc: opts.doc,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ icons: false }),
        // Ctrl/Cmd+Enter casts the spell. Tab is NOT captured, so keyboard users can leave the editor.
        keymap.of([{ key: 'Mod-Enter', run }, ...closeBracketsKeymap, ...completionKeymap, ...historyKeymap, ...defaultKeymap]),
        language.of(sqlConfig([])),
        syntaxHighlighting(inks),
        parchmentTheme,
        hint.of(placeholder(opts.placeholderText)),
        label.of(EditorView.contentAttributes.of({ 'aria-label': opts.label })),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) opts.onChange(u.state.doc.toString());
        }),
      ],
    }),
  });

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (text) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }),
    setSchema: (tables) => view.dispatch({ effects: language.reconfigure(sqlConfig(tables)) }),
    setPlaceholder: (text) => view.dispatch({ effects: hint.reconfigure(placeholder(text)) }),
    setLabel: (text) => view.dispatch({ effects: label.reconfigure(EditorView.contentAttributes.of({ 'aria-label': text })) }),
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
