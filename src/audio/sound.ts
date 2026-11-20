/**
 * Sound effects and background music (all CC0 — see public/assets/CREDITS.md).
 *
 * - Nothing plays before the first user gesture. Files are downloaded and decoded ahead of time (an
 *   offline audio context plays nothing), so the very first click already has its sound.
 * - The speaker button silences everything; the note button turns the music on or off. Both are read
 *   when a sound plays, and `refresh()` applies them to the music at once.
 * - Ogg Vorbis first, MP3 when the browser cannot play Ogg (older Safari) or fails to decode a file.
 * - Audio is a nicety: any failure is silent and never affects the game.
 */
export const SOUNDS = ['click', 'page', 'success', 'error', 'hint', 'react', 'explosion'] as const;
export type SoundName = (typeof SOUNDS)[number];
type Track = SoundName | 'music';
type Format = 'ogg' | 'mp3';

export function isSoundName(value: unknown): value is SoundName {
  return typeof value === 'string' && (SOUNDS as readonly string[]).includes(value);
}

/** Level of each sound: soft, the game is mostly read, and the most frequent ones are the quietest. */
export const LEVEL: Record<Track, number> = {
  click: 0.3,
  page: 0.45,
  success: 0.4,
  error: 0.45,
  hint: 0.3,
  react: 0.3,
  explosion: 0.3,
  music: 0.2,
};
const MUSIC_FADE_IN = 2.5;
const MUSIC_FADE_OUT = 0.4;

/** Events that count as a user gesture for the browsers' autoplay rules. */
const GESTURES = ['pointerdown', 'pointerup', 'keydown', 'touchend'] as const;

/** The parts of the Web Audio API the board uses (so tests can provide a fake). */
export interface PlaybackContext {
  readonly state: string;
  readonly currentTime: number;
  readonly destination: AudioNode;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>;
  createBufferSource(): AudioBufferSourceNode;
  createGain(): GainNode;
}
export type Decoder = Pick<BaseAudioContext, 'decodeAudioData'>;

export interface SoundBoardOptions {
  /** URL of a sound effect, or of the music when `name` is 'music'. */
  url: (name: Track, format: Format) => string;
  isMuted: () => boolean;
  isMusicOn: () => boolean;
  canPlayOgg?: () => boolean;
  fetchFile?: (url: string) => Promise<ArrayBuffer>;
  createContext?: () => PlaybackContext;
  /** Decodes before any gesture without playing anything; undefined when unavailable. */
  createDecoder?: () => Decoder | undefined;
  /**
   * Downloads start only once this settles (resolved or not): on a slow connection the SQL engine,
   * which the game needs, must not share the bandwidth with sound, which is optional.
   */
  waitFor?: Promise<unknown>;
}

const defaultFetch = (url: string) => fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status} ${url}`))));
const defaultDecoder = (): Decoder | undefined =>
  typeof OfflineAudioContext === 'undefined' ? undefined : new OfflineAudioContext(2, 1, 44100);
const defaultCanPlayOgg = () => typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '';

export class SoundBoard {
  private context?: PlaybackContext;
  private decoder?: Decoder | null;
  private unlockedNow!: () => void;
  private readonly unlockedPromise = new Promise<void>((resolve) => (this.unlockedNow = resolve));
  private readonly buffers = new Map<Track, Promise<AudioBuffer | null>>();
  private readonly ready = new Map<Track, AudioBuffer>();
  private music?: { source: AudioBufferSourceNode; gain: GainNode };
  private musicStarting = false;
  private detach?: () => void;
  private readonly formats: Format[];

  constructor(private readonly options: SoundBoardOptions) {
    this.formats = (options.canPlayOgg ?? defaultCanPlayOgg)() ? ['ogg', 'mp3'] : ['mp3', 'ogg'];
  }

  /** Downloads and decodes the effects, then the (larger) music, without playing anything. */
  preload(): void {
    const effects = Promise.all(SOUNDS.map((name) => this.load(name)));
    if (this.options.isMusicOn()) void effects.then(() => this.load('music'));
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

  /** Creates (or resumes) the audio context, from a user gesture, and starts the music if wanted. */
  unlock(): void {
    if (!this.context) {
      try {
        this.context = (this.options.createContext ?? (() => new AudioContext()))();
      } catch {
        this.detach?.();
        return;
      }
      this.unlockedNow();
    }
    if (this.context.state === 'suspended') this.context.resume().catch(() => undefined);
    this.refresh();
  }

  get unlocked(): boolean {
    return !!this.context;
  }

  get musicPlaying(): boolean {
    return !!this.music;
  }

  /** Plays an effect now, unless muted, before the first gesture or not decoded yet (then it is skipped). */
  play(name: SoundName): void {
    const context = this.context;
    const buffer = this.ready.get(name);
    if (!context || !buffer || this.options.isMuted()) return;
    try {
      if (context.state === 'suspended') context.resume().catch(() => undefined);
      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = LEVEL[name];
      source.buffer = buffer;
      source.connect(gain).connect(context.destination);
      source.start();
    } catch {
      // Audio is optional.
    }
  }

  /** Applies the mute and music settings to the music (call after changing them). */
  refresh(): void {
    if (!this.context) return;
    const wanted = this.musicWanted();
    if (wanted && !this.music) void this.startMusic();
    else if (!wanted && this.music) this.stopMusic();
  }

  /** Pauses all audio while the page is hidden (another tab, phone locked). */
  setHidden(hidden: boolean): void {
    const context = this.context;
    if (!context) return;
    (hidden ? context.suspend() : context.resume()).catch(() => undefined);
  }

  private musicWanted(): boolean {
    return !this.options.isMuted() && this.options.isMusicOn();
  }

  private async startMusic(): Promise<void> {
    if (this.musicStarting) return;
    this.musicStarting = true;
    const buffer = await this.load('music');
    this.musicStarting = false;
    const context = this.context;
    if (!buffer || !context || this.music || !this.musicWanted()) return;
    try {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(LEVEL.music, context.currentTime + MUSIC_FADE_IN);
      source.connect(gain).connect(context.destination);
      source.start();
      this.music = { source, gain };
    } catch {
      // Audio is optional.
    }
  }

  private stopMusic(): void {
    const music = this.music;
    const context = this.context;
    this.music = undefined;
    if (!music || !context) return;
    try {
      const now = context.currentTime;
      music.gain.gain.cancelScheduledValues(now);
      music.gain.gain.setValueAtTime(music.gain.gain.value, now);
      music.gain.gain.linearRampToValueAtTime(0, now + MUSIC_FADE_OUT);
      music.source.stop(now + MUSIC_FADE_OUT + 0.05);
    } catch {
      // Audio is optional.
    }
  }

  /** The decoded track, trying each format in turn; null when none works. Cached. */
  private load(track: Track): Promise<AudioBuffer | null> {
    let buffer = this.buffers.get(track);
    if (!buffer) {
      buffer = (async () => {
        await this.options.waitFor?.catch(() => undefined);
        for (const format of this.formats) {
          try {
            const data = await (this.options.fetchFile ?? defaultFetch)(this.options.url(track, format));
            const decoded = await (await this.decoderReady()).decodeAudioData(data);
            this.ready.set(track, decoded);
            return decoded;
          } catch {
            // Try the next format.
          }
        }
        return null;
      })();
      this.buffers.set(track, buffer);
    }
    return buffer;
  }

  /** An offline decoder when the browser has one; otherwise the real context, once unlocked. */
  private async decoderReady(): Promise<Decoder> {
    if (this.decoder === undefined) {
      try {
        this.decoder = (this.options.createDecoder ?? defaultDecoder)() ?? null;
      } catch {
        this.decoder = null;
      }
    }
    if (this.decoder) return this.decoder;
    await this.unlockedPromise;
    return this.context!;
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
