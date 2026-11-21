import { AUTHOR, AUTHOR_URL, REPO_URL } from '../../app/site';
import type { AppContext, Screen } from '../../app/context';
import { routeHash } from '../../app/router';
import { DEVICE_NOTE_KEY, isFlagSet, setFlag } from '../../state/flags';
import { externalLink, h, icon, ICONS, isTouchFirst } from '../dom';
import { homeScene } from '../scenes';
import { World } from '../world';

/** Title screen: the island, the logo and the one thing to do next. */
export function homeScreen(ctx: AppContext): Screen {
  const { i18n, progress } = ctx;
  const world = new World('world--full');
  homeScene(world, innerWidth, innerHeight);

  const done = progress.completedCount();
  const next = progress.nextLevel();
  const nextLevel = next ? ctx.levels.get(next) : undefined;

  // The brand never changes language; it is split in two lines for the stamped logo.
  const [first, second] = i18n.t('app.title').split(/ (?=of )/);
  const logo = h('h1', { class: 'logo' }, first, second ? h('span', {}, second) : null);

  const primary = nextLevel
    ? h('a', { class: 'btn btn--primary btn--big', href: routeHash({ name: 'level', id: nextLevel.id }) },
        i18n.t(done === 0 ? 'home.start' : 'home.continue'))
    : h('a', { class: 'btn btn--primary btn--big', href: routeHash({ name: 'epilogue' }) }, i18n.t('home.epilogue'));

  let status: HTMLElement | null = null;
  if (nextLevel && done > 0) status = h('p', { class: 'tag' }, i18n.t('home.resume', { level: nextLevel.title[i18n.language] }));
  if (!nextLevel) status = h('p', { class: 'tag' }, i18n.t('home.allDone'));

  const main = h(
    'main',
    { id: 'main', class: 'home__hero', tabindex: '-1' },
    logo,
    h('p', { class: 'ribbon ribbon--blue home__subtitle' }, i18n.t('app.subtitle')),
    deviceNote(ctx),
    h('div', { class: 'home__actions' },
      primary,
      status,
      done > 0 ? h('a', { class: 'btn btn--ghost btn--small', href: routeHash({ name: 'map' }) }, i18n.t('home.map')) : null,
    ),
  );

  const element = h(
    'div',
    { class: 'screen screen--home' },
    world.el,
    ctx.chrome(),
    main,
    h('footer', { class: 'credits' },
      h('span', {}, i18n.t('footer.credits')),
      h('span', {}, ...developedBy(i18n.raw('footer.developedBy'), externalLink(AUTHOR_URL, i18n.t('a11y.newTab'), {}, AUTHOR))),
      // On phones the text shrinks to "GitHub" so the footer keeps to three lines, below the island.
      REPO_URL
        ? h('span', { class: 'credits__star' }, externalLink(REPO_URL, i18n.t('a11y.newTab'), {}, icon([ICONS.star]),
          h('span', { class: 'credits__star-long' }, i18n.t('footer.star')),
          h('span', { class: 'credits__star-short', lang: 'en' }, 'GitHub')))
        : null),
  );
  return { element, focus: primary };
}

/** "Developed by {name}" with the name as a link, in the word order of each language. */
function developedBy(template: string, name: HTMLElement): (string | HTMLElement)[] {
  const [before = '', after = ''] = template.split('{name}');
  return [before, name, after].filter((part) => part !== '');
}

/** On touch devices, a quiet one-time note that the game is easier on a computer; closing it is remembered. */
function deviceNote(ctx: AppContext): HTMLElement | null {
  if (!isTouchFirst() || isFlagSet(ctx.store, DEVICE_NOTE_KEY)) return null;
  const close = h('button', { type: 'button', class: 'device-note__close', 'aria-label': ctx.i18n.t('home.deviceNoteClose') }, '×');
  const note = h('p', { class: 'device-note' }, h('span', {}, ctx.i18n.t('home.deviceNote')), close);
  close.addEventListener('click', () => {
    setFlag(ctx.store, DEVICE_NOTE_KEY);
    note.remove();
  });
  return note;
}
