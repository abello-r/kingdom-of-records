/**
 * Sound effects (Kenney, CC0 — see public/assets/CREDITS.md).
 *
 * - Nothing is played, and no audio context is created, before the first user gesture.
 * - Every sound respects the mute setting, read at play time.
 * - Audio is a nicety: any failure (no Web Audio, a format the browser cannot decode, a missing file)
 *   is silent and never affects the game.
 */
export const SOUNDS = ['click', 'page', 'success', 'error', 'hint', 'react', 'explosion'] as const;
export type SoundName = (typeof SOUNDS)[number];

export function isSoundName(value: unknown): value is SoundName {
  return typeof value === 'string' && (SOUNDS as readonly string[]).includes(value);
}

/** Overall level: soft, the game is mostly read. */
const MASTER = 0.5;
/** Per-sound level, so short clicks and the explosion feel balanced. */
const LEVEL: Record<SoundName, number> = {
  click: 0.45,
  page: 0.7,
  success: 0.6,
  error: 0.45,
  hint: 0.55,
  react: 0.45,
  explosion: 0.4,
};

/** Events that count as a user gesture for the browsers' autoplay rules. */
const GESTURES = ['pointerdown', 'pointerup', 'keydown', 'touchend'] as const;

interface MinimalContext {
  readonly state: string;
  readonly currentTime: number;
  readonly destination: AudioNode;
  resume(): Promise<void>;
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>;
  createBufferSource(): AudioBufferSourceNode;
  createGain(): GainNode;
}

export interface SoundBoardOptions {
  /** URL of each sound file. */
  url: (name: SoundName) => string;
  isMuted: () => boolean;
  fetchFile?: (url: string) => Promise<ArrayBuffer>;
  createContext?: () => MinimalContext;
}

export class SoundBoard {
  private context?: MinimalContext;
  private readonly files = new Map<SoundName, Promise<ArrayBuffer | null>>();
  private readonly buffers = new Map<SoundName, AudioBuffer>();
  private readonly fetchFile: (url: string) => Promise<ArrayBuffer>;
  private readonly createContext: () => MinimalContext;
  private detach?: () => void;

  constructor(private readonly options: SoundBoardOptions) {
    this.fetchFile = options.fetchFile ?? ((url) => fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText)))));
    this.createContext = options.createContext ?? (() => new AudioContext());
  }

  /** Downloads the (small) files ahead of time; nothing is decoded or played yet. */
  preload(): void {
    for (const name of SOUNDS) this.file(name);
  }

  /** Waits for the first user gesture before turning audio on. */
  listen(target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>): void {
    const onGesture = () => {
      this.unlock();
      if (this.context?.state === 'running') this.detach?.();
    };
    GESTURES.forEach((type) => target.addEventListener(type, onGesture, { capture: true, passive: true }));
    this.detach = () => GESTURES.forEach((type) => target.removeEventListener(type, onGesture, { capture: true }));
  }

  /** Creates (or resumes) the audio context. Called from a user gesture. */
  unlock(): void {
    if (!this.context) {
      try {
        this.context = this.createContext();
      } catch {
        this.detach?.();
        return;
      }
      for (const name of SOUNDS) void this.decode(name);
    }
    if (this.context.state === 'suspended') this.context.resume().catch(() => undefined);
  }

  get unlocked(): boolean {
    return !!this.context;
  }

  /** Plays a sound now, unless muted, not unlocked yet or not decoded yet (then it is simply skipped). */
  play(name: SoundName): void {
    const context = this.context;
    if (!context || this.options.isMuted()) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    try {
      if (context.state === 'suspended') context.resume().catch(() => undefined);
      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = MASTER * LEVEL[name];
      source.buffer = buffer;
      source.connect(gain).connect(context.destination);
      source.start();
    } catch {
      // Audio is optional.
    }
  }

  private file(name: SoundName): Promise<ArrayBuffer | null> {
    let file = this.files.get(name);
    if (!file) {
      file = this.fetchFile(this.options.url(name)).catch(() => null);
      this.files.set(name, file);
    }
    return file;
  }

  private async decode(name: SoundName): Promise<void> {
    const data = await this.file(name);
    if (!data || !this.context) return;
    try {
      // decodeAudioData detaches the buffer, so it is given a copy.
      this.buffers.set(name, await this.context.decodeAudioData(data.slice(0)));
    } catch {
      // Format not supported by this browser: that sound stays silent.
    }
  }
}

/** The game's sound board, once installed; until then (and in tests) sounds are no-ops. */
let board: Pick<SoundBoard, 'play'> | undefined;

export function installSound(next: Pick<SoundBoard, 'play'> | undefined): void {
  board = next;
}

export function playSound(name: SoundName): void {
  board?.play(name);
}

/**
 * Plays the click sound for any button or link the user activates. An element can choose another
 * sound with `data-sound="page"`, or none with `data-sound="none"` (e.g. when the action has its own).
 */
export function clickSounds(target: Pick<EventTarget, 'addEventListener'>): void {
  target.addEventListener('click', (event) => {
    // The path is taken at dispatch time, so it still works when the click re-renders the button's content.
    const el = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && node.matches('button, a[href]'));
    if (!el) return;
    const choice = el.dataset.sound;
    if (choice === 'none') return;
    playSound(isSoundName(choice) ? choice : 'click');
  });
}
