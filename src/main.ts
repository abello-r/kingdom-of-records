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
const engineReady = sql.warmup();
engineReady
  .then(() => (html.dataset.sqlEngine = 'ready'))
  .catch((error: unknown) => {
    html.dataset.sqlEngine = 'error';
    console.error('SQL engine failed to load', error);
  });

// Sound: files are downloaded and decoded in the background, but nothing plays before the first gesture.
const sound = new SoundBoard({
  url: (name, format) => asset(name === 'music' ? `music/old-tower-inn.${format}` : `sounds/${name}.${format}`),
  isMuted: () => settings.muted,
  isMusicOn: () => settings.music,
  waitFor: engineReady,
});
sound.listen(window);
installSound(sound);
clickSounds(document);
document.addEventListener('visibilitychange', () => sound.setHidden(document.hidden));
const preload = () => sound.preload();
if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 2000 });
else setTimeout(preload, 1000);

new App({
  root,
  store,
  settings,
  i18n: new I18n(settings.language),
  progress: new Progress(store),
  memory: new LevelMemory(store),
  levels: loadLevels(),
  sql,
  onSoundSettings: () => sound.refresh(),
}).start();
