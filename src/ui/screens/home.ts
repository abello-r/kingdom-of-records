import type { AppContext, Screen } from '../../app/context';
import { routeHash } from '../../app/router';
import { h } from '../dom';
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
    h('footer', { class: 'credits' }, i18n.t('footer.credits')),
  );
  return { element, title: `${i18n.t('app.title')} — ${i18n.t('app.subtitle')}`, focus: primary };
}
