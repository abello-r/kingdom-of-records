import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { SQLite, sql } from '@codemirror/lang-sql';
import { HighlightStyle, bracketMatching, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import type { SchemaTable } from '../engine/runner';

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
});

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

function sqlConfig(tables: SchemaTable[]) {
  const schema = Object.fromEntries(tables.map((tb) => [tb.name, tb.columns.map((c) => c.name)]));
  return sql({ dialect: SQLite, schema, upperCaseKeywords: true });
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
