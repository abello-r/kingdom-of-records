// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { clickSounds, installSound, LEVEL, SoundBoard, SOUNDS, type SoundName } from './sound';

/** A fake audio context that records what is started, stopped and how loud. */
function fakeContext() {
  const started: { loop: boolean; gain: { value: number } }[] = [];
  const stopped: number[] = [];
  const context = {
    state: 'running',
    currentTime: 0,
    destination: {} as AudioNode,
    resume: vi.fn(async () => void (context.state = 'running')),
    suspend: vi.fn(async () => void (context.state = 'suspended')),
    decodeAudioData: vi.fn(async (data: ArrayBuffer) => ({ length: data.byteLength }) as unknown as AudioBuffer),
    createGain: () => {
      const gain = { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn((v: number) => void (gain.value = v)), cancelScheduledValues: vi.fn() };
      return { gain, connect: (node: unknown) => node } as unknown as GainNode;
    },
    createBufferSource: () => {
      let gainRef = { value: 0 };
      const source = {
        buffer: null,
        loop: false,
        connect: (node: { gain: { value: number } }) => ((gainRef = node.gain), node),
        start: () => started.push({ loop: source.loop, gain: gainRef }),
        stop: () => stopped.push(1),
      };
      return source as unknown as AudioBufferSourceNode;
    },
  };
  return { context, started, stopped };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup({ muted = false, music = true, ogg = true, offline = true } = {}) {
  const { context, started, stopped } = fakeContext();
  const decoder = { decodeAudioData: vi.fn(async (data: ArrayBuffer) => ({ length: data.byteLength }) as unknown as AudioBuffer) };
  const fetchFile = vi.fn(async (_url: string) => new ArrayBuffer(8));
  const createContext = vi.fn(() => context);
  const state = { muted, music };
  const board = new SoundBoard({
    url: (name, format) => `${name}.${format}`,
    isMuted: () => state.muted,
    isMusicOn: () => state.music,
    canPlayOgg: () => ogg,
    fetchFile,
    createContext,
    createDecoder: () => (offline ? decoder : undefined),
  });
  return { board, context, started, stopped, fetchFile, createContext, decoder, state };
}

describe('SoundBoard', () => {
  it('decodes ahead of time but plays nothing and creates no audio context before the first gesture', async () => {
    const { board, started, createContext, decoder } = setup();
    board.preload();
    await settle();
    board.play('click');
    expect(decoder.decodeAudioData).toHaveBeenCalledTimes(SOUNDS.length + 1); // effects + music
    expect(createContext).not.toHaveBeenCalled();
    expect(started).toHaveLength(0);
  });

  it('plays the very first click: sounds decoded in advance are ready when the gesture arrives', async () => {
    const { board, started } = setup({ music: false });
    board.preload();
    await settle();
    const target = new EventTarget();
    board.listen(target);
    target.dispatchEvent(new Event('pointerdown'));
    board.play('click');
    expect(board.unlocked).toBe(true);
    expect(started).toEqual([{ loop: false, gain: expect.objectContaining({ value: LEVEL.click }) }]);
  });

  it('starts the looping music on the first gesture, quietly, and only once', async () => {
    const { board, started } = setup();
    board.preload();
    await settle();
    board.unlock();
    board.unlock();
    await settle();
    const music = started.filter((s) => s.loop);
    expect(music).toHaveLength(1);
    expect(music[0]!.gain.value).toBe(LEVEL.music); // after the fade-in
    expect(board.musicPlaying).toBe(true);
  });

  it('the speaker silences everything; the note only the music', async () => {
    const { board, started, stopped, state } = setup();
    board.preload();
    board.unlock();
    await settle();
    expect(board.musicPlaying).toBe(true);

    state.music = false;
    board.refresh();
    expect(board.musicPlaying).toBe(false);
    expect(stopped).toHaveLength(1);
    board.play('hint');
    expect(started.filter((s) => !s.loop)).toHaveLength(1); // effects still play

    state.music = true;
    state.muted = true;
    board.refresh();
    expect(board.musicPlaying).toBe(false);
    board.play('hint');
    expect(started.filter((s) => !s.loop)).toHaveLength(1); // nothing new

    state.muted = false;
    board.refresh();
    await settle();
    expect(board.musicPlaying).toBe(true);
  });

  it('uses MP3 when the browser cannot play Ogg, and falls back to the other format when decoding fails', async () => {
    const mp3 = setup({ ogg: false, music: false });
    mp3.board.preload();
    await settle();
    expect(mp3.fetchFile.mock.calls.map(([url]) => url)).toEqual(SOUNDS.map((n) => `${n}.mp3`));

    const broken = setup({ music: false });
    broken.decoder.decodeAudioData.mockImplementationOnce(async () => Promise.reject(new Error('cannot decode')));
    broken.board.preload();
    await settle();
    await settle();
    expect(broken.fetchFile).toHaveBeenCalledWith('click.ogg');
    expect(broken.fetchFile).toHaveBeenCalledWith('click.mp3');
    broken.board.unlock();
    broken.board.play('click');
    expect(broken.started).toHaveLength(1);
  });

  it('decodes with the real context after the gesture when there is no offline decoder', async () => {
    const { board, context, started } = setup({ offline: false, music: false });
    board.preload();
    await settle();
    expect(context.decodeAudioData).not.toHaveBeenCalled();
    board.unlock();
    await settle();
    await settle();
    expect(context.decodeAudioData).toHaveBeenCalledTimes(SOUNDS.length);
    board.play('success');
    expect(started).toHaveLength(1);
  });

  it('fails silently when files are missing everywhere', async () => {
    const { board, started, fetchFile } = setup({ music: false });
    fetchFile.mockImplementation(async () => Promise.reject(new Error('404')));
    board.preload();
    board.unlock();
    await settle();
    for (const name of SOUNDS) board.play(name);
    expect(started).toHaveLength(0);
  });

  it('downloads nothing until the SQL engine is ready, then the effects before the music', async () => {
    let engineReady!: () => void;
    const waitFor = new Promise<void>((resolve) => (engineReady = resolve));
    const fetchFile = vi.fn(async (_url: string) => new ArrayBuffer(8));
    const board = new SoundBoard({
      url: (name, format) => `${name}.${format}`,
      isMuted: () => false,
      isMusicOn: () => true,
      canPlayOgg: () => true,
      fetchFile,
      createDecoder: () => ({ decodeAudioData: async () => ({}) as AudioBuffer }),
      waitFor,
    });
    board.preload();
    await settle();
    expect(fetchFile).not.toHaveBeenCalled();
    engineReady();
    await settle();
    await settle();
    const urls = fetchFile.mock.calls.map(([url]) => url);
    expect(urls.slice(0, SOUNDS.length)).toEqual(SOUNDS.map((n) => `${n}.ogg`));
    expect(urls.at(-1)).toBe('music.ogg');
  });

  it('pauses while the page is hidden', async () => {
    const { board, context } = setup();
    board.setHidden(true); // before the gesture: nothing to pause
    expect(context.suspend).not.toHaveBeenCalled();
    board.unlock();
    board.setHidden(true);
    expect(context.suspend).toHaveBeenCalled();
    board.setHidden(false);
    expect(context.resume).toHaveBeenCalled();
  });

  it('does nothing when Web Audio is not available', () => {
    const board = new SoundBoard({
      url: (n) => n,
      isMuted: () => false,
      isMusicOn: () => true,
      canPlayOgg: () => true,
      fetchFile: async () => new ArrayBuffer(1),
      createDecoder: () => undefined,
      createContext: () => {
        throw new Error('no audio');
      },
    });
    expect(() => {
      board.preload();
      board.unlock();
      board.play('click');
      board.refresh();
    }).not.toThrow();
    expect(board.unlocked).toBe(false);
  });
});

describe('clickSounds', () => {
  it('clicks for buttons and links, uses data-sound and skips data-sound="none"', () => {
    const played: SoundName[] = [];
    installSound({ play: (name) => played.push(name) });
    document.body.innerHTML = `
      <button id="a"><span id="inner">Go</span></button>
      <a id="b" href="#/map" data-sound="page">Next</a>
      <button id="c" data-sound="none">Run</button>
      <p id="d">text</p>`;
    clickSounds(document);
    for (const id of ['inner', 'b', 'c', 'd']) document.getElementById(id)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(played).toEqual(['click', 'page']);
    installSound(undefined);
  });
});
