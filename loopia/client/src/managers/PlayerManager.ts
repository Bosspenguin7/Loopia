import Phaser from 'phaser';
import { MapSchema } from '@colyseus/schema';
import { convertShortcodes } from '../data/emojis';
import { Player } from '../schema/GameState';

export interface PlayerEntity {
    container: Phaser.GameObjects.Container;
    nameLabel: Phaser.GameObjects.Text;
    chatBubble?: Phaser.GameObjects.Container;
    targetX?: number; // For interpolation (remote players)
    targetY?: number;
}

export class PlayerManager {
    private scene: Phaser.Scene;
    private playerEntities: { [sessionId: string]: PlayerEntity } = {};
    private mySessionId?: string;
    private characterScale: number;
    private animsCreated = false;

    /** Called when a player sprite is clicked: (sessionId, guestId, playerName) */
    public onPlayerClicked?: (sessionId: string, guestId: number, playerName: string) => void;

    constructor(scene: Phaser.Scene, characterScale: number = 0.075) {
        this.scene = scene;
        this.characterScale = characterScale;
        this.createAnimations();
    }

    private createAnimations() {
        if (this.animsCreated) return;
        const anims = this.scene.anims;

        // Idle: first frame only
        if (!anims.exists('char_idle')) {
            anims.create({
                key: 'char_idle',
                frames: [{ key: 'character', frame: 0 }],
                frameRate: 1,
                repeat: 0,
            });
        }

        // Walk: frames 1-7 loop (frame 0 is contact pose, only used for idle)
        if (!anims.exists('char_walk')) {
            anims.create({
                key: 'char_walk',
                frames: anims.generateFrameNumbers('character', { start: 1, end: 7 }),
                frameRate: 6,
                repeat: -1,
            });
        }

        // Walk back (northwest): character_back sprite
        if (!anims.exists('char_walk_back')) {
            anims.create({
                key: 'char_walk_back',
                frames: anims.generateFrameNumbers('character_back', { start: 1, end: 7 }),
                frameRate: 6,
                repeat: -1,
            });
        }

        // Walk northeast: character_ne sprite
        if (!anims.exists('char_walk_ne')) {
            anims.create({
                key: 'char_walk_ne',
                frames: anims.generateFrameNumbers('character_ne', { start: 1, end: 7 }),
                frameRate: 6,
                repeat: -1,
            });
        }

        this.animsCreated = true;
    }

    public setMySessionId(sessionId: string) {
        this.mySessionId = sessionId;
    }

    public syncPlayers(playersState: MapSchema<Player>) {
        if (!playersState) return;

        // 1. Update or Create players
        playersState.forEach((player: Player, sessionId: string) => {
            const finalX = player.x;
            const finalY = player.y;

            if (!this.playerEntities[sessionId]) {
                this.createPlayer(sessionId, player);
            } else {
                const entity = this.playerEntities[sessionId];
                // All players (local + remote) interpolate toward server position
                entity.targetX = finalX;
                entity.targetY = finalY;
                entity.nameLabel.setText(player.name || 'Player');

                // Keep sprite data in sync + animation
                const sprite = entity.container.list[0] as Phaser.GameObjects.Sprite;
                if (sprite) {
                    sprite.setData('guestId', player.guestId || 0);
                    sprite.setData('playerName', player.name || 'Player');

                    // Play animation based on server anim state (includes direction)
                    const anim = player.anim;
                    const prevAnim = sprite.getData('lastAnim') as string | undefined;

                    if (anim !== prevAnim) {
                        sprite.setData('lastAnim', anim);

                        if (anim === 'walk_up') {
                            sprite.play('char_walk_back');
                            sprite.setFlipX(false);
                        } else if (anim === 'walk_down') {
                            sprite.play('char_walk');
                            sprite.setFlipX(false);
                        } else if (anim === 'walk_left') {
                            sprite.play('char_walk');
                            sprite.setFlipX(true);
                        } else if (anim === 'walk_right') {
                            sprite.play('char_walk_ne');
                            sprite.setFlipX(false);
                        } else if (anim === 'idle') {
                            const prevKey = sprite.anims.currentAnim?.key;
                            sprite.stop();
                            const idleTexture = prevKey === 'char_walk_back' ? 'character_back'
                                : prevKey === 'char_walk_ne' ? 'character_ne'
                                : 'character';
                            sprite.setTexture(idleTexture, 0);
                        }
                    }
                }
            }
        });

        // 2. Remove disconnected players
        Object.keys(this.playerEntities).forEach((sessionId) => {
            if (!playersState.has(sessionId)) {
                this.removePlayer(sessionId);
            }
        });
    }

    private createPlayer(sessionId: string, data: any) {
        const container = this.scene.add.container(data.x, data.y);
        const sprite = this.scene.add.sprite(0, -5, 'character');
        sprite.setOrigin(0.5, 0.85);
        sprite.setScale(this.characterScale);
        sprite.play(data.anim === 'walk' ? 'char_walk' : 'char_idle');

        // Make sprite interactive for player clicking
        sprite.setInteractive({ useHandCursor: true });
        sprite.setData('sessionId', sessionId);
        sprite.setData('guestId', data.guestId || 0);
        sprite.setData('playerName', data.name || 'Player');
        sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            if (this.onPlayerClicked) {
                this.onPlayerClicked(
                    sprite.getData('sessionId'),
                    sprite.getData('guestId'),
                    sprite.getData('playerName')
                );
            }
        });

        const nameLabel = this.scene.add.text(0, -65, data.name || 'Player', {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        });
        nameLabel.setOrigin(0.5, 1);
        nameLabel.setVisible(false);

        container.add([sprite, nameLabel]);
        container.setDepth(data.x + 2 * data.y);

        this.playerEntities[sessionId] = {
            container,
            nameLabel,
            targetX: data.x,
            targetY: data.y
        };
    }

    private removePlayer(sessionId: string) {
        if (this.playerEntities[sessionId]) {
            this.playerEntities[sessionId].container.destroy();
            delete this.playerEntities[sessionId];
        }
    }

    public update(delta: number) {
        // Interpolate ALL players (local + remote) toward server position
        const dt = delta / 1000;
        Object.keys(this.playerEntities).forEach(sessionId => {
            const entity = this.playerEntities[sessionId];
            if (entity.targetX !== undefined && entity.targetY !== undefined) {
                const dx = entity.targetX - entity.container.x;
                const dy = entity.targetY - entity.container.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 2) {
                    entity.container.x = entity.targetX;
                    entity.container.y = entity.targetY;
                } else if (dist > 200) {
                    entity.container.x = entity.targetX;
                    entity.container.y = entity.targetY;
                } else {
                    // Lerp: use faster factor so client tracks server closely
                    const t = 1 - Math.pow(0.005, dt);
                    entity.container.x += dx * t;
                    entity.container.y += dy * t;
                }

                // Isometric depth: x + 2*y (consistent with scene object depth)
                entity.container.setDepth(entity.container.x + 2 * entity.container.y);
            }
        });
    }

    public getPlayerEntity(sessionId: string) {
        return this.playerEntities[sessionId];
    }

    public getMyPlayer() {
        if (this.mySessionId) return this.playerEntities[this.mySessionId];
        return undefined;
    }

    public showWhisperBubble(sessionId: string, message: string) {
        const entity = this.playerEntities[sessionId];
        if (!entity) return;

        if (entity.chatBubble) {
            entity.chatBubble.destroy();
        }

        const bubble = this.scene.add.container(0, -70);
        const bg = this.scene.add.graphics();
        const textObj = this.scene.add.text(0, 0, convertShortcodes(message), {
            fontSize: '11px',
            color: '#e9d5ff',
            wordWrap: { width: 120 }
        });
        textObj.setOrigin(0.5, 0.5);

        const padding = 8;
        const w = textObj.width + padding * 2;
        const h = textObj.height + padding * 2;

        bg.fillStyle(0x7c3aed, 0.9);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        bg.lineStyle(1, 0xa855f7, 0.6);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

        bubble.add(bg);
        bubble.add(textObj);
        entity.container.add(bubble);
        entity.chatBubble = bubble;

        this.scene.time.delayedCall(5000, () => {
            if (entity.chatBubble === bubble) {
                bubble.destroy();
                entity.chatBubble = undefined;
            }
        });
    }

    public showChatBubble(sessionId: string, message: string) {
        const entity = this.playerEntities[sessionId];
        if (!entity) return;

        // Remove old bubble
        if (entity.chatBubble) {
            entity.chatBubble.destroy();
        }

        const bubble = this.scene.add.container(0, -70);

        // Player name in red (like CafeScene NPCs)
        const playerName = entity.nameLabel.text || 'Player';
        const nameObj = this.scene.add.text(0, 0, playerName, {
            fontFamily: "'Outfit', Arial, sans-serif",
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#dc2626',
        });
        nameObj.setOrigin(0.5, 0.5);

        // Message text below name
        const bg = this.scene.add.graphics();
        const textObj = this.scene.add.text(0, 0, convertShortcodes(message), {
            fontSize: '11px',
            color: '#000000',
            wordWrap: { width: 120 }
        });
        textObj.setOrigin(0.5, 0.5);

        const padding = 8;
        const contentWidth = Math.max(nameObj.width, textObj.width);
        const w = contentWidth + padding * 2;
        const totalHeight = nameObj.height + 3 + textObj.height;
        const h = totalHeight + padding * 2;

        // Position name and message vertically
        nameObj.setPosition(0, -totalHeight / 2 + nameObj.height / 2);
        textObj.setPosition(0, totalHeight / 2 - textObj.height / 2);

        bg.fillStyle(0xffffff, 0.95);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        bg.lineStyle(1, 0x000000, 0.3);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

        bubble.add(bg);
        bubble.add(nameObj);
        bubble.add(textObj);
        entity.container.add(bubble);
        entity.chatBubble = bubble;

        // Auto-hide after 5 seconds
        this.scene.time.delayedCall(5000, () => {
            if (entity.chatBubble === bubble) {
                bubble.destroy();
                entity.chatBubble = undefined;
            }
        });
    }
}
