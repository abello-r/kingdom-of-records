import type { SqlClient } from '../engine/client';
import type { Level } from '../engine/types';
import type { I18n } from '../i18n';
import type { LevelMemory } from '../state/level-memory';
import type { LevelId } from '../state/levels';
import type { Progress } from '../state/progress';
import { saveSettings, type Settings } from '../state/settings';
import type { KeyValueStore } from '../state/storage';
import { createChrome } from '../ui/chrome';
import { APP_NAME } from './site';
import { TITLES } from '../titles/titles';
import { homeScreen } from '../ui/screens/home';
import { mapScreen } from '../ui/screens/map';
import type { AppContext, LevelSession, Screen } from './context';
import { parseRoute, routeHash, type Route } from './router';

export interface AppDeps {
  root: HTMLElement;
  store: KeyValueStore;
  settings: Settings;
  i18n: I18n;
  progress: Progress;
  memory: LevelMemory;
  levels: Map<LevelId, Level>;
  sql: SqlClient;
  /** Called after the sound or music setting changes, so the audio follows at once. */
  onSoundSettings?: () => void;
}

/** Owns the current screen and re-renders it on navigation, language change or width change. */
export class App {
  private screen: Screen | null = null;
  private readonly ctx: AppContext;
  private chromeUpdaters: (() => void)[] = [];
  private lastWidth = innerWidth;
  /** Increments on every render so a slow (lazy-loaded) screen never replaces a newer one. */
  private renderToken = 0;

  constructor(private readonly deps: AppDeps) {
    const sessions = new Map<LevelId, LevelSession>();
    this.ctx = {
      i18n: deps.i18n,
      progress: deps.progress,
      memory: deps.memory,
      settings: deps.settings,
      store: deps.store,
      levels: deps.levels,
      sql: deps.sql,
      sessions,
      navigate: (route, opts) => this.navigate(route, opts?.replace ?? false),
      chrome: (back) => this.chrome(back),
    };
  }

  start(): void {
    addEventListener('hashchange', () => void this.render(true));
    let timer = 0;
    addEventListener('resize', () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Only width matters for layout; height changes (e.g. the phone keyboard) must not re-render.
        if (innerWidth === this.lastWidth) return;
        this.lastWidth = innerWidth;
        void this.render(false);
      }, 200);
    });
    this.deps.i18n.onChange(() => {
      this.deps.settings.language = this.deps.i18n.language;
      saveSettings(this.deps.store, this.deps.settings);
      void this.render(false);
    });
    void this.render(false);
  }

  private navigate(route: Route, replace: boolean): void {
    const hash = routeHash(route);
    if (replace) {
      history.replaceState(null, '', hash);
      void this.render(true);
    } else if (location.hash !== hash) {
      location.hash = hash; // triggers hashchange → render
    } else {
      void this.render(true);
    }
  }

  private chrome(back?: { href: string; labelKey: string }): HTMLElement {
    const { i18n, settings } = this.deps;
    const bar = createChrome({
      i18n,
      back,
      isMuted: () => settings.muted,
      isMusicOn: () => settings.music,
      onLanguage: (lang) => i18n.setLanguage(lang),
      onToggleMute: () => this.changeSound(() => (settings.muted = !settings.muted)),
      onToggleMusic: () => this.changeSound(() => (settings.music = !settings.music)),
    });
    this.chromeUpdaters.push(bar.update);
    return bar.element;
  }

  private changeSound(change: () => void): void {
    change();
    saveSettings(this.deps.store, this.deps.settings);
    this.chromeUpdaters.forEach((fn) => fn());
    this.deps.onSoundSettings?.();
  }

  private async build(route: Route): Promise<Screen> {
    if (route.name === 'level') {
      const level = this.deps.levels.get(route.id);
      if (level && this.deps.progress.isLevelUnlocked(route.id)) {
        // The level screen (with the SQL editor) is loaded on demand to keep the first load light.
        const { levelScreen } = await import('../ui/screens/level');
        return levelScreen(this.ctx, level);
      }
      history.replaceState(null, '', routeHash({ name: 'map' }));
      return mapScreen(this.ctx);
    }
    if (route.name === 'epilogue') {
      if (this.deps.progress.nextLevel() === null) {
        const { epilogueScreen } = await import('../ui/screens/epilogue');
        return epilogueScreen(this.ctx);
      }
      history.replaceState(null, '', routeHash({ name: 'map' }));
      return mapScreen(this.ctx);
    }
    if (route.name === 'title') {
      // A title can be seen once its stage is complete; the last one after the epilogue too.
      const title = TITLES.find((t) => t.id === route.id);
      if (title && this.deps.progress.isStageCompleted(title.stage)) {
        const { titleScreen } = await import('../ui/screens/title');
        return titleScreen(this.ctx, title);
      }
      history.replaceState(null, '', routeHash({ name: 'map' }));
      return mapScreen(this.ctx);
    }
    if (route.name === 'spellbook') {
      const { spellbookScreen } = await import('../ui/screens/spellbook');
      return spellbookScreen(this.ctx, route.from);
    }
    if (route.name === 'map') return mapScreen(this.ctx, route.select);
    return homeScreen(this.ctx);
  }

  /** Mounts the screen for the current URL. `moveFocus` is true after an in-app navigation. */
  private async render(moveFocus: boolean): Promise<void> {
    const token = ++this.renderToken;
    const scroll = moveFocus ? 0 : scrollY;
    const { i18n, root } = this.deps;
    this.chromeUpdaters = [];
    const next = await this.build(parseRoute(location.hash));
    if (token !== this.renderToken) {
      next.destroy?.();
      return;
    }
    this.screen?.destroy?.();
    this.screen = next;
    document.documentElement.lang = i18n.language;
    document.title = APP_NAME;
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = i18n.t('a11y.skipLink');
    root.replaceChildren(this.screen.element);
    scrollTo(0, scroll);
    if (moveFocus) (this.screen.focus ?? root.querySelector<HTMLElement>('#main'))?.focus({ preventScroll: true });
  }
}
