import '@fontsource/jersey-10/latin-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './styles/main.css';
import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';

import { I18n } from './i18n';
import { SqlClient } from './engine/client';
import { Progress } from './state/progress';
import { loadSettings, saveSettings } from './state/settings';
import { createBrowserStore } from './state/storage';
import { h } from './ui/dom';
import { createHeader } from './ui/header';
import { renderHome } from './ui/home';

const store = createBrowserStore();
const settings = loadSettings(store, navigator.languages ?? [navigator.language]);
const progress = new Progress(store);
const i18n = new I18n(settings.language);

const app = document.getElementById('app');
if (!app) throw new Error('#app element not found');

const main = h('main', { id: 'main', class: 'screen', tabindex: '-1' });
const footer = h('footer', { class: 'site-footer' });

const header = createHeader({
  i18n,
  isMuted: () => settings.muted,
  onLanguage: (lang) => i18n.setLanguage(lang),
  onToggleMute: () => {
    settings.muted = !settings.muted;
    saveSettings(store, settings);
    header.update();
  },
});

function render(): void {
  document.documentElement.lang = i18n.language;
  document.title = `${i18n.t('app.title')} — ${i18n.t('app.subtitle')}`;
  const skip = document.querySelector('.skip-link');
  if (skip) skip.textContent = i18n.t('a11y.skipLink');
  header.update();
  main.replaceChildren(renderHome(i18n, progress));
  footer.textContent = i18n.t('footer.credits');
}

i18n.onChange(() => {
  settings.language = i18n.language;
  saveSettings(store, settings);
  render();
});

app.append(header.element, main, footer);
render();

// The SQL engine lives in a Web Worker; warm it up in the background so the first level opens instantly.
// The wasm URL is made absolute because the worker resolves relative URLs from its own location.
const sqlClient = new SqlClient(new URL(sqlWasmUrl, document.baseURI).href);
const root = document.documentElement;
root.dataset.sqlEngine = 'loading';
sqlClient
  .warmup()
  .then(() => (root.dataset.sqlEngine = 'ready'))
  .catch((error: unknown) => {
    root.dataset.sqlEngine = 'error';
    console.error('SQL engine failed to load', error);
  });
