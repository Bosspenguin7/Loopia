import Scene from "./Scene";
import { SceneBehavior } from './SceneBehavior';
import { LoadingScreen } from '../ui/LoadingScreen';
import { FishingMinigame } from '../ui/FishingMinigame';
import { QuestDialog } from '../ui/QuestDialog';
import { QuestService } from '../services/QuestService';
import { createDoorArrow, DoorArrow } from '../ui/DoorArrow';
import { pendingJoinInfo, clearPendingJoinInfo } from '../main';
import { ROOM_TYPES } from '@shared/constants';

export class GameScene extends Scene {
    private behavior!: SceneBehavior;
    private wasSmall: boolean = false;
    private fishingMinigame!: FishingMinigame;
    private questDialog!: QuestDialog;
    private doorArrows: DoorArrow[] = [];
    private poolImg?: Phaser.GameObjects.Image;
    private poolActive = false;

    // Auto-reconnect data (when returning from sub-scenes)
    private autoReconnect?: { playerName: string; roomLabel: string; spawnX?: number; spawnY?: number };

    constructor() {
        super();
    }

    init(data?: { reconnect?: boolean; playerName?: string; roomLabel?: string; spawnX?: number; spawnY?: number }) {
        if (data?.reconnect && data.playerName && data.roomLabel) {
            this.autoReconnect = {
                playerName: data.playerName,
                roomLabel: data.roomLabel,
                spawnX: data.spawnX,
                spawnY: data.spawnY
            };
        } else {
            this.autoReconnect = undefined;
        }
    }

    preload() {
        this.load.setBaseURL('./');

        this.load.on('progress', (value: number) => {
            LoadingScreen.getInstance().setProgress(value);
        });

        this.load.pack('pack', 'asset-pack.json');
        this.load.audio('birds', 'assets/common/audio/birds.mp3');
    }

    async create() {
        this.editorCreate();

        // Initialize behavior
        this.behavior = new SceneBehavior(this, {
            cameraBounds: { width: 1200, height: 750 },
            cameraCenter: { x: 600, y: 375 },
            gridSize: { width: 1200, height: 750 },
            soundButtonX: 760,
            ambientSound: 'birds',
            obstacleKey: 'game_room',
        });
        this.behavior.initManagers();

        // If viewport fits the whole map, camera is already centered by SceneBehavior.
        // If viewport is smaller, camera will follow player in update().
        // Override static centering only if viewport is large enough:
        const { width: vw, height: vh } = this.scale.gameSize;
        if (vw >= 1200 && vh >= 750) {
            this.cameras.main.centerOn(600, 375);
        }



        const loading = LoadingScreen.getInstance();

        // Auto-reconnect (returning from sub-scene) or first-time join from lobby
        if (this.autoReconnect) {
            loading.show('Reconnecting...');
            const spawnPos = this.autoReconnect.spawnX && this.autoReconnect.spawnY
                ? { x: this.autoReconnect.spawnX, y: this.autoReconnect.spawnY }
                : undefined;
            await this.connectToRoom(this.autoReconnect.playerName, this.autoReconnect.roomLabel, spawnPos);
            this.autoReconnect = undefined;
        } else if (pendingJoinInfo) {
            await this.connectToRoom(pendingJoinInfo.playerName, pendingJoinInfo.roomName);
            clearPendingJoinInfo();
        }

        loading.hide();

        // Fishing minigame & quest dialog for pool interaction
        this.fishingMinigame = new FishingMinigame();
        this.questDialog = new QuestDialog();

        // Cleanup on shutdown
        this.events.on('shutdown', () => {
            this.doorArrows.forEach(a => a.destroy());
            this.doorArrows = [];
            this.fishingMinigame.destroy();
            this.questDialog.destroy();
            this.behavior.shutdown();
        });
    }

    private async connectToRoom(playerName: string, roomName: string, spawnPos?: { x: number; y: number }) {
        await this.behavior.connectToRoom(() =>
            this.behavior.network!.joinRoom(ROOM_TYPES.GAME, playerName, roomName, spawnPos)
        );

        // Expose for console testing
        (window as any).room = this.behavior.room;

        this.setupInteractions();
    }

    private setupInteractions() {
        // Bears & Salmon Door
        const doorBears = this.children.getByName("door_bearsandsalmon") as Phaser.GameObjects.Polygon;
        if (doorBears) {
            doorBears.setInteractive(new Phaser.Geom.Polygon(doorBears.geom.points), Phaser.Geom.Polygon.Contains);
            doorBears.setVisible(true);
            doorBears.setAlpha(0.01);

            const bearsArrow = createDoorArrow(this, { x: doorBears.x + 22, y: doorBears.y + 30, direction: 'right' });
            this.doorArrows.push(bearsArrow);

            doorBears.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                bearsArrow.show();
            });

            doorBears.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                bearsArrow.hide();
            });

            doorBears.on('pointerdown', () => {
                const doorEntranceX = doorBears.x + 22;
                const doorEntranceY = doorBears.y + 60;
                this.behavior.inputManager.movePlayerTo(doorEntranceX, doorEntranceY, () => {
                    this.scene.start('bearsandsalmon', {
                        roomLabel: this.behavior.network?.currentRoomLabel || "Room 1"
                    });
                });
            });
        }

        // Apartment Door
        const doorApartment = this.children.getByName("door_apartment") as Phaser.GameObjects.Polygon;
        if (doorApartment) {
            doorApartment.setInteractive(new Phaser.Geom.Polygon(doorApartment.geom.points), Phaser.Geom.Polygon.Contains);
            doorApartment.setVisible(true);
            doorApartment.setAlpha(0.01);

            const apartmentArrow = createDoorArrow(this, { x: doorApartment.x + 72, y: doorApartment.y + 50, direction: 'up' });
            this.doorArrows.push(apartmentArrow);

            doorApartment.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                apartmentArrow.show();
            });

            doorApartment.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                apartmentArrow.hide();
            });

            doorApartment.on('pointerdown', () => {
                // Walk to the center of the door polygon
                const targetX = doorApartment.x + 72;
                const targetY = doorApartment.y + 37;
                this.behavior.inputManager.movePlayerTo(targetX, targetY, () => {
                    this.scene.start('ApartmentScene', {
                        roomLabel: this.behavior.network?.currentRoomLabel || "Room 1"
                    });
                });
            });
        }

        // Cafe Door
        const doorCafe = this.children.getByName("door_cafe") as Phaser.GameObjects.Polygon;
        if (doorCafe) {
            doorCafe.setInteractive(new Phaser.Geom.Polygon(doorCafe.geom.points), Phaser.Geom.Polygon.Contains);
            doorCafe.setVisible(true);
            doorCafe.setAlpha(0.01);

            const cafeArrow = createDoorArrow(this, { x: doorCafe.x + 55, y: doorCafe.y + 25, direction: 'up' });
            this.doorArrows.push(cafeArrow);

            doorCafe.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                cafeArrow.show();
            });

            doorCafe.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                cafeArrow.hide();
            });

            doorCafe.on('pointerdown', () => {
                const targetX = doorCafe.x + 55;
                const targetY = doorCafe.y + 12;
                this.behavior.inputManager.movePlayerTo(targetX, targetY, () => {
                    this.scene.start('CafeScene', {
                        roomLabel: this.behavior.network?.currentRoomLabel || "Room 1"
                    });
                });
            });
        }

        // Avalabs Door
        const doorAvalabs = this.children.getByName("door_avalabs") as Phaser.GameObjects.Polygon;
        if (doorAvalabs) {
            doorAvalabs.setInteractive(new Phaser.Geom.Polygon(doorAvalabs.geom.points), Phaser.Geom.Polygon.Contains);
            doorAvalabs.setVisible(true);
            doorAvalabs.setAlpha(0.01);

            const avalabsArrow = createDoorArrow(this, { x: doorAvalabs.x + 65, y: doorAvalabs.y + 10, direction: 'right' });
            this.doorArrows.push(avalabsArrow);

            doorAvalabs.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                avalabsArrow.show();
            });

            doorAvalabs.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                avalabsArrow.hide();
            });

            doorAvalabs.on('pointerdown', () => {
                const targetX = doorAvalabs.x + 65;
                const targetY = doorAvalabs.y + 10;
                this.behavior.inputManager.movePlayerTo(targetX, targetY, () => {
                    this.scene.start('avalabs', {
                        roomLabel: this.behavior.network?.currentRoomLabel || "Room 1"
                    });
                });
            });
        }

        // Grotto Door
        const doorGrotto = this.children.getByName("door_grotto") as Phaser.GameObjects.Polygon;
        if (doorGrotto) {
            doorGrotto.setInteractive(new Phaser.Geom.Polygon(doorGrotto.geom.points), Phaser.Geom.Polygon.Contains);
            doorGrotto.setVisible(true);
            doorGrotto.setAlpha(0.01);

            const grottoArrow = createDoorArrow(this, { x: doorGrotto.x + 39, y: doorGrotto.y + 15, direction: 'up' });
            this.doorArrows.push(grottoArrow);

            doorGrotto.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                grottoArrow.show();
            });

            doorGrotto.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                grottoArrow.hide();
            });

            doorGrotto.on('pointerdown', () => {
                const targetX = doorGrotto.x + 39;
                const targetY = doorGrotto.y + 3;
                this.behavior.inputManager.movePlayerTo(targetX, targetY, () => {
                    this.scene.start('grotto', {
                        roomLabel: this.behavior.network?.currentRoomLabel || "Room 1"
                    });
                });
            });
        }

        // Pool — Fishing interaction (only active when quest is accepted & available)
        this.poolImg = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'pool'
        ) as Phaser.GameObjects.Image | undefined;
        if (this.poolImg) {
            // Start non-interactive; will be enabled by refreshPoolState()
            this.poolImg.on('pointerover', () => { if (this.poolActive) this.poolImg!.setTint(0xddddff); });
            this.poolImg.on('pointerout', () => { this.poolImg!.clearTint(); });
            this.poolImg.on('pointerdown', async () => {
                if (!this.poolActive) return;
                this.fishingMinigame.start(async (caught) => {
                    if (caught) {
                        // User needs to go to the NPC to turn it in.
                    }
                });
            });
            this.refreshPoolState();
        }
    }

    /** Enable/disable pool interactivity based on fishing quest state */
    private async refreshPoolState() {
        if (!this.poolImg) return;
        try {
            const quests = await QuestService.getInstance().fetchQuestsForScene("bears_room");
            const quest = quests.find(q => q.questKey === "fishing");
            if (!quest) { this.setPoolActive(false); return; }

            const progress = await QuestService.getInstance().getQuestProgress(quest.id);
            if (!progress || progress.completedToday || progress.hasPendingSubmission) {
                this.setPoolActive(false);
            } else {
                this.setPoolActive(true);
            }
        } catch {
            this.setPoolActive(false);
        }
    }

    private setPoolActive(active: boolean) {
        this.poolActive = active;
        if (!this.poolImg) return;
        if (active) {
            this.poolImg.setInteractive({ useHandCursor: true });
        } else {
            this.poolImg.disableInteractive();
        }
    }

    update(_time: number, delta: number) {
        if (this.behavior) {
            this.behavior.update(delta);

            const { width: vw, height: vh } = this.scale.gameSize;
            const isSmall = vw < 1200 || vh < 750;

            // Follow player when viewport is smaller than the map
            if (isSmall) {
                const me = this.behavior.playerManager.getMyPlayer();
                if (me) {
                    this.cameras.main.centerOn(me.container.x, me.container.y);
                }
            } else if (this.wasSmall) {
                // Viewport grew back to full size — reset camera to map center
                this.cameras.main.centerOn(600, 375);
            }

            this.wasSmall = isSmall;

            // Hide chat when viewport is smaller than canvas
            if (this.behavior.chatOverlay) {
                this.behavior.chatOverlay.setVisible(!isSmall);
            }
        }
    }
}
