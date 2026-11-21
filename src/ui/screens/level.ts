import { playSound } from '../../audio/sound';
import type { AppContext, Screen } from '../../app/context';
import { routeHash } from '../../app/router';
import { REPO_URL } from '../../app/site';
import { feedbackMessages, type Message } from '../../engine/messages';
import type { SchemaTable } from '../../engine/runner';
import type { DialogueLine, Level, ResultSet, TableSnapshot } from '../../engine/types';
import { ALL_LEVELS } from '../../state/levels';
import { titleFor } from '../../titles/titles';
import { bookIcon, externalLink, fill, h, icon, ICONS, img, isTouchFirst, prefersReducedMotion } from '../dom';
import { createSqlEditor, type SqlEditor } from '../editor';
import { rich } from '../rich';
import { levelStrip, stripHeight } from '../scenes';
import { dialogue as storyLine } from '../story';
import { typeKey } from '../sql-types';
import { World } from '../world';

/** Level after which the one-time "star it on GitHub" message appears, and when (after its reaction). */
const STAR_LEVEL = 'easy-3';
const STAR_DELAY_MS = 2200;
/** With reduced motion, how long the diorama's end state stays on screen before coming back. */
const STILL_VIEW_MS = 1500;
/** Pause on the diorama once its reaction is over, before scrolling back. */
const AFTER_REACTION_MS = 500;

/** A level: the open Great Registry under a diorama of the region. */
export function levelScreen(ctx: AppContext, level: Level): Screen {
  const { i18n, progress, memory } = ctx;
  const lang = i18n.language;
  const t = i18n.t.bind(i18n);
  const session = ctx.sessions.get(level.id) ?? {};
  ctx.sessions.set(level.id, session);

  // ---------- scene ----------
  const compact = innerWidth < 761;
  // Tall enough on phones for archers standing on the towers; on desktop, with the header's band on top.
  const sceneHeight = stripHeight(Math.min(innerWidth, 1920));
  const world = new World('world--strip');
  world.el.style.height = `${sceneHeight}px`;
  // The level's own scene; `solve` plays its reaction when the spell is right.
  const solve = levelStrip(world, level, Math.min(innerWidth, 1920), sceneHeight);
  const title = h('h1', { class: 'ribbon-small ribbon-small--blue level-title' },
    h('small', {}, `${t(`stages.${level.stage}.difficulty`)} ${level.order}`), ' ', level.title[lang]);

  // ---------- left page: story, task, hints, schema ----------
  const story = h('div', { class: 'story' }, ...level.narrative.map((line) => dialogue(line)));
  const hintsBox = h('div', { class: 'hints', 'aria-live': 'polite' });
  const schemaBox = h('div', { class: 'schema' });
  const storyPage = h(
    'section',
    { class: 'page paper', 'aria-labelledby': 'task-title' },
    story,
    h('div', { class: 'task' },
      img('ui/icon-task.png'),
      h('h2', { id: 'task-title' }, t('level.task')),
      h('p', {}, rich(level.task[lang]))),
    hintsBox,
    h('h3', {}, t('level.schema')),
    schemaBox,
  );

  // ---------- right page: spell and answer ----------
  const editorHost = h('div', { class: 'editor' });
  const clearBtn = h('button', { type: 'button', class: 'btn btn--ghost btn--small' }, t('level.clear'));
  // Running has its own sounds (right / wrong), so its buttons do not click.
  const runBtns = [h('button', { type: 'button', class: 'btn', 'data-sound': 'none' }), h('button', { type: 'button', class: 'btn', 'data-sound': 'none' })];
  const hintBtns = [h('button', { type: 'button', class: 'btn btn--small btn--hint', 'data-sound': 'hint' }), h('button', { type: 'button', class: 'btn btn--hint', 'data-sound': 'hint' })];
  const nextBtns = [h('a', { class: 'btn btn--primary', 'data-sound': 'page' }), h('a', { class: 'btn btn--primary', 'data-sound': 'page' })];
  const answer = h('div', { class: 'answer__body' });
  const answerLive = h('div', { class: 'answer', 'aria-live': 'polite' }, h('h3', {}, t('level.answer')), answer);
  const spellPage = h(
    'section',
    { class: 'page paper spell', 'aria-labelledby': 'spell-title' },
    h('div', { class: 'spell__head' }, h('h2', { id: 'spell-title' }, t('level.spell')),
      h('a', { class: 'btn btn--ghost btn--small spellbook-link', href: routeHash({ name: 'spellbook', from: level.id }), 'data-sound': 'page' },
        bookIcon(), h('span', { class: 'spellbook-link__text' }, t('spellbook.short'))),
      clearBtn),
    replayNote(),
    editorHost,
    h('div', { class: 'actions' }, runBtns[0], hintBtns[0]),
    h('p', { class: 'shortcut' }, t('level.shortcut'), ' ', h('kbd', {}, 'Ctrl'), ' + ', h('kbd', {}, 'Enter')),
    answerLive,
    // One-time, quiet invitation to star the project, shown just above "Turn the page".
    h('p', { class: 'star-nudge', hidden: true },
      REPO_URL ? externalLink(REPO_URL, t('a11y.newTab'), {}, icon([ICONS.star]), t('level.starNudge')) : null),
    h('div', { class: 'next' }, nextBtns[0]),
  );
  const dock = h('div', { class: 'dock' }, runBtns[1], nextBtns[1], hintBtns[1]);

  const element = h(
    'div',
    { class: `screen screen--level stage-${level.stage}` },
    h('div', { class: 'scene' }, world.el, ctx.chrome({ href: routeHash({ name: 'map', select: level.id }), labelKey: 'a11y.backToMap' }), title),
    h('main', { id: 'main', class: 'book wood', tabindex: '-1' }, h('div', { class: 'pages' }, storyPage, spellPage)),
    dock,
  );

  /** On a page solved before, offer to start it again from a blank page (progress is kept). */
  function replayNote(): HTMLElement | null {
    if (!progress.isCompleted(level.id) || session.solvedNow) return null;
    const restart = h('button', { type: 'button', class: 'btn btn--ghost btn--small' }, t('level.restart'));
    const note = h('div', { class: 'replay' }, h('p', {}, t('level.replay')), restart);
    restart.addEventListener('click', () => {
      memory.resetLevel(level.id);
      editor.setValue('');
      session.result = undefined;
      renderHints();
      renderAnswer();
      note.remove();
      focusEditor();
    });
    return note;
  }

  // ---------- behaviour ----------
  let running = false;
  /** Ends the automatic scrolling around a reaction (listeners off). */
  let endShow: (() => void) | null = null;
  let starTimer = 0;
  let schema: SchemaTable[] = [];
  const editor: SqlEditor = createSqlEditor({
    parent: editorHost,
    doc: memory.draft(level.id) ?? '',
    label: t('a11y.editor'),
    placeholderText: 'SELECT …',
    onRun: () => void run(),
    onChange: (text) => memory.saveDraft(level.id, text),
  });

  ctx.sql
    .schema(level)
    .then((tables) => {
      schema = tables;
      editor.setSchema(tables);
      renderSchema();
    })
    .catch(() => fill(schemaBox, h('p', { class: 'note note--error' }, t('level.engineError'))));

  function dialogue(line: DialogueLine, isNew = false): HTMLElement {
    return storyLine(i18n, line.speaker, line.text[lang], isNew);
  }

  /** One ledger card per table: "Table: villagers", then "Columns:" with each column and its type in plain words. */
  function renderSchema(): void {
    fill(schemaBox, ...schema.map((tb) => {
      const titleId = `schema-${tb.name}`;
      return h('section', { class: 'ledger', 'aria-labelledby': titleId },
        h('p', { class: 'ledger__head', id: titleId }, h('span', {}, t('level.schemaTable')), ' ', h('code', {}, tb.name)),
        h('p', { class: 'ledger__label' }, t('level.schemaColumns')),
        h('dl', { class: 'ledger__cols' }, ...tb.columns.map((c) => {
          const key = typeKey(c.type);
          return h('div', { class: 'ledger__row' },
            h('dt', {}, h('code', {}, c.name)),
            h('dd', {}, key ? t(`types.${key}`) : c.type.toLowerCase() || '—'));
        })));
    }));
  }

  function renderHints(): void {
    const used = memory.hintsUsed(level.id);
    fill(hintsBox, ...level.hints.slice(0, used).map((hint, i) =>
      h('div', { class: 'hint-card', tabindex: '-1' },
        img('fx/hint.png'),
        h('div', {}, h('b', {}, t('level.hintTitle', { n: i + 1, total: level.hints.length })), h('p', {}, rich(hint[lang], {}, { blocks: true }))))));
    const left = level.hints.length - used;
    for (const btn of hintBtns) {
      fill(btn, img('fx/hint.png'), left > 0 ? i18n.tp('level.hint', left) : t('level.noHints'));
      btn.disabled = left === 0;
    }
  }

  function renderButtons(): void {
    const solved = !!session.solvedNow;
    for (const btn of runBtns) {
      btn.textContent = running ? t('level.running') : t('level.run');
      btn.classList.toggle('btn--primary', !solved);
      btn.disabled = running;
    }
    const target = nextTarget();
    for (const a of nextBtns) {
      a.hidden = !solved;
      a.textContent = t(target.labelKey);
      a.href = target.href;
    }
    element.classList.toggle('is-solved', solved);
  }

  function nextTarget(): { href: string; labelKey: string } {
    const i = ALL_LEVELS.indexOf(level.id);
    const following = ALL_LEVELS[i + 1];
    if (!following) return { href: routeHash({ name: 'epilogue' }), labelKey: 'level.finish' };
    // The end of a stage: its title first (the title page then leads to the map).
    const title = level.order === 5 ? titleFor(level.stage) : undefined;
    if (title) return { href: routeHash({ name: 'title', id: title.id }), labelKey: 'level.next' };
    if (level.order === 5) return { href: routeHash({ name: 'map', select: following }), labelKey: 'level.next' };
    return { href: routeHash({ name: 'level', id: following }), labelKey: 'level.next' };
  }

  function renderAnswer(): void {
    const result = session.result;
    if (!result) {
      fill(answer, h('p', { class: 'waiting' }, t('level.waiting')));
      return;
    }
    const parts: Node[] = [];
    const rowsText = (n: number) => (n === 0 ? t('level.noRows') : i18n.tp('level.rows', n));
    if (!result.error) {
      if (result.tables) {
        result.tables.forEach((tb: TableSnapshot) =>
          parts.push(resultTable(tb, rowsText(tb.rows.length), rich(i18n.raw('level.tableNow'), { table: tb.name }))));
      } else {
        const last = [...result.statements].reverse().find((s) => s.kind === 'rows');
        if (last && last.kind === 'rows') parts.push(resultTable(last.result, rowsText(last.result.rows.length)));
      }
      const changes = result.statements.filter((s) => s.kind === 'changes').reduce((n, s) => n + (s.kind === 'changes' ? s.changes : 0), 0);
      if (result.statements.some((s) => s.kind === 'changes')) parts.push(h('p', { class: 'rows-note' }, i18n.tp('level.changes', changes)));
    }
    const asides = (result.notices ?? []).map((n) =>
      h('p', { class: 'note__aside' }, rich(i18n.raw(`notices.${n.key}`), { value: `'${n.params.value}'` })));
    if (result.correct) {
      const tick = img('fx/success.png', 'note__icon');
      const note = h('div', { class: 'note note--success', role: 'status' },
        tick, h('div', {}, h('p', {}, t('level.success')), ...asides));
      parts.push(note);
      if (session.solvedNow && !prefersReducedMotion()) {
        // Sparkle burst coming out of the tick.
        note.append(img('fx/sparkle.png', 'burst'), img('fx/twinkle.png', 'burst burst--twinkle'));
      }
    } else {
      const lines = feedbackMessages(result);
      parts.push(h('div', { class: 'note note--error', role: 'alert' },
        img('ui/icon-error.png', 'note__icon'),
        h('div', {}, ...lines.map((m, i) => h('p', { class: i > 0 ? 'note__tip' : undefined }, message(m))), ...asides)));
    }
    fill(answer, ...parts);
  }

  function message(m: Message): DocumentFragment {
    return rich(i18n.raw(m.key), m.params);
  }

  async function run(): Promise<void> {
    if (running) return;
    running = true;
    renderButtons();
    try {
      session.result = await ctx.sql.validate(level, editor.getValue());
    } catch {
      session.result = undefined;
      fill(answer, h('p', { class: 'note note--error', role: 'alert' }, t('level.engineError')));
      playSound('error');
      running = false;
      renderButtons();
      return;
    }
    running = false;
    playSound(session.result.correct ? 'success' : 'error');
    const firstSolve = session.result.correct && !session.solvedNow;
    if (firstSolve) {
      session.solvedNow = true;
      progress.complete(level.id);
      story.append(...level.success.map((line) => dialogue(line, true)));
    }
    renderButtons();
    renderAnswer();
    if (firstSolve) {
      // The focus goes to "Turn the page" without moving the page: the diorama comes first.
      (compact ? nextBtns[1] : nextBtns[0])!.focus({ preventScroll: true });
      void showReaction();
    }
    if (firstSolve && level.id === STAR_LEVEL && REPO_URL && progress.shouldAskForStar()) {
      // After the diorama has reacted; marked as shown only once it is actually on screen.
      starTimer = window.setTimeout(() => {
        progress.markStarAsked();
        session.starNudge = true;
        showStarNudge(true);
      }, prefersReducedMotion() ? 0 : STAR_DELAY_MS);
    }
  }

  /**
   * The kingdom's reaction to a first right answer, in view: scrolls up to the diorama if it is not fully
   * on screen, plays the whole reaction, then scrolls back to the success message and "Turn the page".
   * Any scroll, tap or key from the player stops the automatic scrolling (the reaction still plays).
   * With reduced motion: jumps instead of scrolling, and the reaction shows its end state.
   */
  async function showReaction(): Promise<void> {
    const reduced = prefersReducedMotion();
    let stopped = false;
    const stop = (e: Event) => {
      if (e instanceof KeyboardEvent && ['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)) return;
      stopped = true;
    };
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    inputs.forEach((type) => window.addEventListener(type, stop, { capture: true, passive: true }));
    endShow = () => inputs.forEach((type) => window.removeEventListener(type, stop, { capture: true }));
    try {
      const scene = element.querySelector<HTMLElement>('.scene')!.getBoundingClientRect();
      const away = scene.top < 0 || world.el.getBoundingClientRect().bottom > innerHeight;
      if (away) await scrollToY(scrollY + scene.top, reduced, () => stopped);
      solve();
      world.celebrate();
      if (reduced) {
        if (away) await pause(STILL_VIEW_MS);
      } else {
        await world.settled();
        await pause(AFTER_REACTION_MS);
      }
      const note = answer.querySelector<HTMLElement>('.note--success');
      if (stopped || !note || !element.isConnected) return;
      // The message and the inline "Turn the page" (on phones it is in the dock, always on screen).
      const parts = [note, nextBtns[0]!].map((el) => el.getBoundingClientRect()).filter((r) => r.height > 0);
      const top = Math.min(...parts.map((r) => r.top));
      const bottom = Math.max(...parts.map((r) => r.bottom));
      const dockEl = element.querySelector<HTMLElement>('.dock');
      const visibleBottom = innerHeight - (dockEl && getComputedStyle(dockEl).display !== 'none' ? dockEl.offsetHeight : 0);
      if (top >= 0 && bottom <= visibleBottom) return;
      const target = bottom - top > visibleBottom - 24 ? top - 12 : (top + bottom) / 2 - visibleBottom / 2;
      await scrollToY(scrollY + target, reduced, () => stopped);
    } finally {
      endShow?.();
      endShow = null;
    }
  }

  /** Puts the cursor in the editor, except on touch devices, where it would open the keyboard. */
  function focusEditor(): void {
    if (!isTouchFirst()) editor.focus();
  }

  function showStarNudge(animate: boolean): void {
    const nudge = spellPage.querySelector<HTMLElement>('.star-nudge');
    if (!nudge) return;
    nudge.hidden = false;
    nudge.classList.toggle('is-new', animate && !prefersReducedMotion());
  }

  runBtns.forEach((b) => b.addEventListener('click', () => void run()));
  hintBtns.forEach((b) =>
    b.addEventListener('click', () => {
      memory.useHint(level.id, level.hints.length);
      renderHints();
      const cards = hintsBox.querySelectorAll<HTMLElement>('.hint-card');
      const last = cards[cards.length - 1];
      last?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      last?.focus({ preventScroll: true });
    }),
  );
  clearBtn.addEventListener('click', () => {
    editor.setValue('');
    focusEditor();
  });

  // Restore what this page showed before (e.g. after switching language).
  if (session.solvedNow) {
    story.append(...level.success.map((line) => dialogue(line)));
    // Redrawing a solved page (e.g. after a language change): show the end state without replaying it.
    const animated = world.instant;
    world.instant = true;
    solve();
    world.instant = animated;
  }
  renderHints();
  renderButtons();
  renderAnswer();
  if (session.solvedNow && session.starNudge) showStarNudge(false);

  return {
    element,
    // On touch devices the page opens on the story (the main landmark gets the focus, no keyboard).
    focus: isTouchFirst() ? undefined : editor.view.contentDOM,
    destroy: () => {
      window.clearTimeout(starTimer);
      endShow?.();
      editor.destroy();
      world.destroy();
    },
  };
}

/** A result set as a table; `rowsText` is the translated row count, `caption` an optional rich title. */
function resultTable(result: ResultSet, rowsText: string, caption?: DocumentFragment): HTMLElement {
  return h('div', { class: 'result' },
    caption ? h('p', { class: 'result__caption' }, caption) : null,
    h('div', { class: 'result__scroll' },
      h('table', {},
        h('thead', {}, h('tr', {}, ...result.columns.map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', {}, ...result.rows.map((row) => h('tr', {}, ...row.map((v) => h('td', {}, cell(v)))))))),
    h('p', { class: 'rows-note' }, rowsText));
}

function cell(v: unknown): string {
  if (v === null) return 'NULL';
  if (v instanceof Uint8Array) return `<${v.length} bytes>`;
  return String(v);
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Scrolls the page to `y` (smoothly, or at once with reduced motion) and resolves when it gets there,
 * when the player takes over (`stopped`) or after a second at most. Does nothing once stopped.
 */
function scrollToY(y: number, reduced: boolean, stopped: () => boolean): Promise<void> {
  const top = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
  if (stopped() || Math.abs(scrollY - top) < 2) return Promise.resolve();
  if (reduced) {
    window.scrollTo({ top, behavior: 'instant' });
    return Promise.resolve();
  }
  window.scrollTo({ top, behavior: 'smooth' });
  return new Promise((resolve) => {
    const started = performance.now();
    const check = () => {
      if (stopped() || Math.abs(scrollY - top) < 2 || performance.now() - started > 1000) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}
