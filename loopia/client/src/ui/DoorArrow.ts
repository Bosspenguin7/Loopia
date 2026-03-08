import Phaser from 'phaser';

export interface DoorArrowConfig {
    x: number;
    y: number;
    /** Direction the arrow points: 'left' | 'right' | 'up' | 'down' */
    direction?: 'left' | 'right' | 'up' | 'down';
    /** Optional scale override (default 0.3) */
    scale?: number;
}

export interface DoorArrow {
    arrow: Phaser.GameObjects.Image;
    tween: Phaser.Tweens.Tween;
    show(): void;
    hide(): void;
    destroy(): void;
}

const ARROW_TEXTURE_MAP: Record<string, string> = {
    right: 'arrow-northeast',
    left: 'arrow-southwest',
    up: 'arrow-northwest',
    down: 'arrow-southeast',
};

const ARROW_ASSET_MAP: Record<string, string> = {
    'arrow-southeast': 'assets/ui/arrow-southeast.png',
    'arrow-southwest': 'assets/ui/arrow-southwest.png',
    'arrow-northeast': 'assets/ui/arrow-northeast.png',
    'arrow-northwest': 'assets/ui/arrow-northwest.png',
};

/** Preload all arrow textures. Call once in a scene's preload(). */
export function preloadDoorArrows(scene: Phaser.Scene): void {
    for (const [key, path] of Object.entries(ARROW_ASSET_MAP)) {
        if (!scene.textures.exists(key)) {
            scene.load.image(key, path);
        }
    }
}

/**
 * Creates a bouncing arrow next to a door to indicate entry/exit.
 * Hidden by default — call show()/hide() on pointerover/pointerout.
 */
export function createDoorArrow(scene: Phaser.Scene, config: DoorArrowConfig): DoorArrow {
    const dir = config.direction || 'right';
    const textureKey = ARROW_TEXTURE_MAP[dir];

    // If texture not loaded yet, load it dynamically
    if (!scene.textures.exists(textureKey)) {
        const path = ARROW_ASSET_MAP[textureKey];
        scene.load.image(textureKey, path);
        scene.load.start();
    }

    const arrow = scene.add.image(config.x, config.y, textureKey);
    arrow.setOrigin(0.5, 0.5);
    arrow.setScale(config.scale ?? 0.3);
    arrow.setDepth(5000);
    arrow.setVisible(false);

    // Isometric sway: tiny diagonal nudge in the arrow's direction
    // Southeast: x+, y+  |  Southwest: x-, y+  |  Northeast: x+, y-  |  Northwest: x-, y-
    const isoOffset: Record<string, { dx: number; dy: number }> = {
        'arrow-southeast': { dx: 3, dy: 1.5 },
        'arrow-southwest': { dx: -3, dy: 1.5 },
        'arrow-northeast': { dx: 3, dy: -1.5 },
        'arrow-northwest': { dx: -3, dy: -1.5 },
    };
    const off = isoOffset[textureKey] || { dx: 3, dy: 1.5 };

    const tween = scene.tweens.add({
        targets: arrow,
        x: { from: config.x, to: config.x + off.dx },
        y: { from: config.y, to: config.y + off.dy },
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        paused: true,
    });

    return {
        arrow,
        tween,
        show() {
            arrow.setVisible(true);
            arrow.setAlpha(1);
            arrow.x = config.x;
            arrow.y = config.y;
            tween.restart();
        },
        hide() {
            arrow.setVisible(false);
            tween.pause();
        },
        destroy() {
            tween.destroy();
            arrow.destroy();
        },
    };
}
