// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { clickSounds, installSound, SoundBoard, SOUNDS, type SoundName } from './sound';

function fakeContext() {
  const started: number[] = [];
  const context = {
    state: 'suspended',
    currentTime: 0,
    destination: {} as AudioNode,
    resume: vi.fn(async () => void (context.state = 'running')),
    decodeAudioData: vi.fn(async (data: ArrayBuffer) => ({ length: data.byteLength }) as unknown as AudioBuffer),
    createGain: () => ({ gain: { value: 0 }, connect: (node: unknown) => node }) as unknown as GainNode,
    createBufferSource: () =>
      ({ buffer: null, connect: (node: unknown) => node, start: () => started.push(1) }) as unknown as AudioBufferSourceNode,
  };
  return { context, started };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup(muted = false) {
  const { context, started } = fakeContext();
  const fetchFile = vi.fn(async () => new ArrayBuffer(8));
  const createContext = vi.fn(() => context);
  const state = { muted };
  const board = new SoundBoard({ url: (n) => `sounds/${n}.ogg`, isMuted: () => state.muted, fetchFile, createContext });
  return { board, context, started, fetchFile, createContext, state };
}

describe('SoundBoard', () => {
  it('stays silent and creates no audio context before the first gesture', async () => {
    const { board, started, createContext } = setup();
    board.preload();
    await settle();
    board.play('click');
    expect(createContext).not.toHaveBeenCalled();
    expect(started).toHaveLength(0);
  });

  it('starts on the first gesture, decodes every sound once and plays them', async () => {
    const { board, started, context, fetchFile } = setup();
    const target = new EventTarget();
    board.listen(target);
    target.dispatchEvent(new Event('pointerdown'));
    await settle();
    expect(board.unlocked).toBe(true);
    expect(context.resume).toHaveBeenCalled();
    expect(context.decodeAudioData).toHaveBeenCalledTimes(SOUNDS.length);
    expect(fetchFile).toHaveBeenCalledTimes(SOUNDS.length);
    board.play('success');
    board.play('explosion');
    expect(started).toHaveLength(2);
  });

  it('respects the mute setting at play time', async () => {
    const { board, started, state } = setup(true);
    board.unlock();
    await settle();
    board.play('click');
    expect(started).toHaveLength(0);
    state.muted = false;
    board.play('click');
    expect(started).toHaveLength(1);
  });

  it('fails silently when a file cannot be loaded or decoded', async () => {
    const { board, started, context, fetchFile } = setup();
    fetchFile.mockImplementationOnce(async () => Promise.reject(new Error('404')));
    context.decodeAudioData.mockImplementationOnce(async () => Promise.reject(new Error('format')));
    board.unlock();
    await settle();
    for (const name of SOUNDS) board.play(name);
    expect(started.length).toBe(SOUNDS.length - 2);
  });

  it('does nothing when Web Audio is not available', () => {
    const board = new SoundBoard({
      url: (n) => n,
      isMuted: () => false,
      fetchFile: async () => new ArrayBuffer(1),
      createContext: () => {
        throw new Error('no audio');
      },
    });
    expect(() => {
      board.unlock();
      board.play('click');
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
