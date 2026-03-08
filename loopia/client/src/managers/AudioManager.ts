import { Constants } from '../constants';

const STORAGE_KEY = 'loopia_sound_enabled';

export class AudioManager {
    private static instance: AudioManager;
    private scene?: Phaser.Scene;
    private ambientSound?: Phaser.Sound.BaseSound;
    private muted: boolean = true; // Default: muted (browser autoplay policy)

    private constructor() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            this.muted = saved !== 'true';
        }
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public init(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public playAmbient(key: string) {
        if (!this.scene) return;

        this.stopAmbient();

        this.ambientSound = this.scene.sound.add(key, {
            loop: true,
            volume: this.muted ? 0 : Constants.AMBIENT_VOLUME
        });
        this.ambientSound.play();
    }

    public stopAmbient() {
        if (this.ambientSound) {
            this.ambientSound.stop();
            this.ambientSound.destroy();
            this.ambientSound = undefined;
        }
    }

    public toggle(): boolean {
        this.muted = !this.muted;
        localStorage.setItem(STORAGE_KEY, this.muted ? 'false' : 'true');

        if (this.ambientSound && 'volume' in this.ambientSound) {
            (this.ambientSound as any).volume = this.muted ? 0 : Constants.AMBIENT_VOLUME;
        }

        return !this.muted;
    }

    public isMuted(): boolean {
        return this.muted;
    }
}
