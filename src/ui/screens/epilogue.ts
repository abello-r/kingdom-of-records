import { AUTHOR, AUTHOR_URL, REPO_URL } from '../../app/site';
import type { AppContext, Screen } from '../../app/context';
import { routeHash } from '../../app/router';
import type { Speaker } from '../../engine/types';
import { externalLink, h, icon, ICONS } from '../dom';
import { isCompact } from '../scenes';
import { dialogue } from '../story';
import { World } from '../world';

/** The ending, in story order: who speaks each epilogue line. */
const LINES: [Speaker, string][] = [
  ['narrator', 'epilogue.l1'],
  ['narrator', 'epilogue.l2'],
  ['aldric', 'epilogue.l3'],
  ['garrick', 'epilogue.l4'],
  ['scribe', 'epilogue.l5'],
  ['aldric', 'epilogue.l6'],
];

/** People and works credited at the end (names are not translated). */
const CREDITS: [string, string[]][] = [
  ['credits.art', ['Tiny Swords — Pixel Frog']],
  ['credits.effects', ['Super Pixel Effects Gigapack — Will Tice / unTied Games']],
  ['credits.music', ['Medieval: The Old Tower Inn — RandomMind (CC0)']],
  ['credits.sound', ['Kenney · Spring Spring · StarNinjas · PWL · TinyWorlds (CC0)']],
  ['credits.fonts', ['Jersey 10 — The Soft Type Project Authors (SIL OFL 1.1)', 'JetBrains Mono — The JetBrains Mono Project Authors (SIL OFL 1.1)']],
  ['credits.tech', ['SQLite · sql.js', 'CodeMirror']],
];

/** Epilogue: the council after Corvin's arrest, the ending of the story and the credits. */
export function epilogueScreen(ctx: AppContext): Screen {
  const { i18n } = ctx;
  const t = i18n.t.bind(i18n);
  const width = Math.min(innerWidth, 1920);
  const compact = isCompact(width);
  const height = compact ? 190 : 262;
  const world = new World('world--strip');
  world.el.style.height = `${height}px`;
  epilogueScene(world, width, height);

  const title = h('h1', { class: 'ribbon-small ribbon-small--blue level-title' }, h('small', {}, t('epilogue.title')), ' ', t('epilogue.name'));
  const story = h('section', { class: 'page paper', 'aria-labelledby': 'epilogue-story' },
    h('h2', { id: 'epilogue-story', class: 'visually-hidden' }, t('epilogue.name')),
    h('div', { class: 'story' }, ...LINES.map(([speaker, key]) => dialogue(i18n, speaker, t(key)))));
  const credits = h('section', { class: 'page paper credits-page', 'aria-labelledby': 'credits-title' },
    h('h2', { id: 'credits-title' }, t('credits.title')),
    h('dl', { class: 'credits-list' },
      h('div', {}, h('dt', {}, t('credits.developedBy')), h('dd', {}, externalLink(AUTHOR_URL, t('a11y.newTab'), {}, AUTHOR))),
      ...CREDITS.map(([key, names]) => h('div', {}, h('dt', {}, t(key)), ...names.map((n) => h('dd', {}, n))))),
    h('p', { class: 'credits-thanks' }, t('credits.thanks')),
    REPO_URL ? h('p', { class: 'credits-star' }, externalLink(REPO_URL, t('a11y.newTab'), {}, icon([ICONS.star]), t('credits.star'))) : null,
    h('div', { class: 'credits-actions' },
      h('a', { class: 'btn btn--primary', href: routeHash({ name: 'map' }) }, t('epilogue.back')),
      h('a', { class: 'btn btn--ghost btn--small', href: routeHash({ name: 'home' }) }, t('epilogue.home'))));

  const element = h('div', { class: 'screen screen--level screen--epilogue is-solved' },
    h('div', { class: 'scene' }, world.el, ctx.chrome({ href: routeHash({ name: 'map' }), labelKey: 'a11y.backToMap' }), title),
    h('main', { id: 'main', class: 'book wood', tabindex: '-1' }, h('div', { class: 'pages' }, story, credits)));

  // The kingdom celebrates once the page has been shown.
  window.setTimeout(() => world.celebrate(), 700);
  return { element, destroy: () => world.destroy() };
}

/** The castle court: Corvin under guard beside his coffers, the council, the sheep in his garden. */
function epilogueScene(world: World, width: number, height: number): void {
  const compact = isCompact(width);
  const k = compact ? 0.6 : 0.82;
  const ground = height - (compact ? 14 : 22);
  world.island(-64, 36, Math.ceil(width / 64) + 2, Math.ceil(height / 64) + 1, 'spring');
  const put = (name: Parameters<World['put']>[0], f: number, dy: number, opts: { flip?: boolean; s?: number; wide?: boolean } = {}) => {
    if (opts.wide && compact) return;
    world.put(name, f * width, ground + dy * k, { flip: opts.flip, scale: k * (opts.s ?? 1) });
  };
  put('props/tree-1', compact ? 0.05 : 0.035, 2, { s: 0.95 });
  put('buildings/castle', 0.42, -18, { wide: true });
  put('units/warrior-blue', compact ? 0.16 : 0.13, 16);
  put('units/pawn-blue', compact ? 0.28 : 0.2, 18);
  put('units/monk-purple', compact ? 0.4 : 0.27, 18); // Lady Maud (shown on phones too)
  put('units/warrior-red', 0.56, 16, { flip: true, wide: true });
  put('units/warrior-blue', compact ? 0.52 : 0.62, 20);
  put('units/monk-red', compact ? 0.62 : 0.68, 18, { flip: true });
  put('units/warrior-blue', compact ? 0.72 : 0.74, 20, { flip: true });
  put('props/gold-pile', compact ? 0.62 : 0.68, 36);
  put('props/bush-2', 0.84, 6, { wide: true });
  put('units/sheep-grazing', compact ? 0.86 : 0.88, 18);
  put('units/sheep', 0.94, 22, { flip: true });
}
