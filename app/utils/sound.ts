export class SoundManager {
  private static instance: SoundManager;
  private enabled: boolean = true;
  private audio: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/sounds/complete.mp3');
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public toggleSound(enabled: boolean) {
    this.enabled = enabled;
  }

  public playComplete() {
    if (this.enabled && this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(err => console.log('Sound playback failed:', err));
    }
  }
}
