import '@fontsource/jersey-10/latin-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './styles/main.css';
import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';

import { App } from './app/app';
import { clickSounds, installSound, SoundBoard } from './audio/sound';
import { SqlClient } from './engine/client';
import { I18n } from './i18n';
import { loadLevels } from './levels';
import { LevelMemory } from './state/level-memory';
import { Progress } from './state/progress';
import { loadSettings } from './state/settings';
import { createBrowserStore } from './state/storage';
import { asset } from './ui/dom';
import { installTheme } from './ui/theme';

installTheme();

const root = document.getElementById('app');
if (!root) throw new Error('#app element not found');

const store = createBrowserStore();
const settings = loadSettings(store, navigator.languages ?? [navigator.language]);

// The SQL engine lives in a Web Worker. The wasm URL is made absolute because the worker resolves
// relative URLs from its own location.
const sql = new SqlClient(new URL(sqlWasmUrl, document.baseURI).href);
const html = document.documentElement;
html.dataset.sqlEngine = 'loading';
sql
  .warmup()
  .then(() => (html.dataset.sqlEngine = 'ready'))
  .catch((error: unknown) => {
    html.dataset.sqlEngine = 'error';
    console.error('SQL engine failed to load', error);
  });

// Sound effects: files are fetched in the background, but audio only starts after the first gesture.
const sound = new SoundBoard({ url: (name) => asset(`sounds/${name}.ogg`), isMuted: () => settings.muted });
sound.listen(window);
installSound(sound);
clickSounds(document);
const preload = () => sound.preload();
if ('requestIdleCallback' in window) requestIdleCallback(preload);
else setTimeout(preload, 1500);

new App({
  root,
  store,
  settings,
  i18n: new I18n(settings.language),
  progress: new Progress(store),
  memory: new LevelMemory(store),
  levels: loadLevels(),
  sql,
}).start();
