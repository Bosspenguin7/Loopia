import { SceneBehavior } from './SceneBehavior';
import { LoadingScreen } from '../ui/LoadingScreen';
import { CafeMenuPanel } from '../ui/CafeMenuPanel';
import { CafeShopService } from '../services/CafeShopService';
import { createDoorArrow, DoorArrow } from '../ui/DoorArrow';
import cafe from './cafe';
import { ROOM_TYPES } from '@shared/constants';

export class CafeScene extends cafe {
    private behavior!: SceneBehavior;
    private roomLabel: string = "";
    private chatBubbleTimer?: Phaser.Time.TimerEvent;
    private cafeMenuPanel?: CafeMenuPanel;
    private doorArrow?: DoorArrow;

    constructor() {
        super();
    }

    init(data: { roomLabel: string }) {
        this.roomLabel = data.roomLabel || "";
    }

    preload() {
        this.load.pack('pack', 'asset-pack.json');
    }

    async create() {
        const loading = LoadingScreen.getInstance();
        loading.show('Entering Cafe...');

        // Editor-generated scene layout
        this.editorCreate();

        // Holly must render in front of the bar — set bar behind, holly on top
        const barImg = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'cafe_bar'
        ) as Phaser.GameObjects.Image | undefined;
        const holly = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'npc_holly'
        ) as Phaser.GameObjects.Image | undefined;
        if (barImg) barImg.setDepth(-1);
        if (holly) holly.setDepth(1);

        // Initialize behavior
        this.behavior = new SceneBehavior(this, {
            cameraBounds: { width: 1200, height: 750 },
            cameraCenter: { x: 600, y: 375 },
            playerScale: 0.15,
            gridSize: { width: 1200, height: 750 },
            soundButtonX: 760,
            obstacleKey: 'cafe_room',
        });
        this.behavior.initManagers();

        // Connect
        try {
            const playerName = this.behavior.network!.playerName || 'Player';

            // Find spawn point - random position inside door polygon
            const insideDoor = this.children.getByName("cafe_inside_door") as Phaser.GameObjects.Polygon;
            let spawnPos: { x: number; y: number } | undefined;
            if (insideDoor) {
                const pts = insideDoor.geom.points;
                const worldPts = pts.map((p: Phaser.Geom.Point) => ({
                    x: insideDoor.x + (p.x - insideDoor.displayOriginX) * insideDoor.scaleX,
                    y: insideDoor.y + (p.y - insideDoor.displayOriginY) * insideDoor.scaleY
                }));
                const triIndex = Math.floor(Math.random() * (worldPts.length - 2)) + 1;
                const a = worldPts[0], b = worldPts[triIndex], c = worldPts[triIndex + 1];
                let r1 = Math.random(), r2 = Math.random();
                if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
                spawnPos = {
                    x: a.x + r1 * (b.x - a.x) + r2 * (c.x - a.x),
                    y: a.y + r1 * (b.y - a.y) + r2 * (c.y - a.y)
                };
            }

            await this.behavior.connectToRoom(() =>
                this.behavior.network!.joinRoom(ROOM_TYPES.CAFE, playerName, this.roomLabel, spawnPos)
            );

            loading.hide();
        } catch (e: any) {
            loading.hide();
        }

        // Sound button


        // NPC Chat Bubbles (3s delay after entering)
        this.time.delayedCall(3000, () => this.startNpcChatLoop());

        // Preload cafe menu data in background
        CafeShopService.getInstance().preload();

        // NPC Cafe Menu interaction
        this.cafeMenuPanel = new CafeMenuPanel();
        this.setupNpcMenuInteraction();

        // Exit Door Interaction
        const exitDoor = this.children.getByName("cafe_inside_door") as Phaser.GameObjects.Polygon;
        if (exitDoor) {
            exitDoor.setInteractive(new Phaser.Geom.Polygon(exitDoor.geom.points), Phaser.Geom.Polygon.Contains);
            exitDoor.setAlpha(0.01);

            this.doorArrow = createDoorArrow(this, { x: exitDoor.x - 10, y: exitDoor.y + 130, direction: 'left' });

            exitDoor.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                this.doorArrow?.show();
            });

            exitDoor.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                this.doorArrow?.hide();
            });

            exitDoor.on('pointerdown', () => {
                const pts = exitDoor.geom.points;
                const worldPts = pts.map((p: Phaser.Geom.Point) => ({
                    x: exitDoor.x + (p.x - exitDoor.displayOriginX) * exitDoor.scaleX,
                    y: exitDoor.y + (p.y - exitDoor.displayOriginY) * exitDoor.scaleY
                }));
                const triIndex = Math.floor(Math.random() * (worldPts.length - 2)) + 1;
                const a = worldPts[0], b = worldPts[triIndex], c = worldPts[triIndex + 1];
                let r1 = Math.random(), r2 = Math.random();
                if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
                const targetX = a.x + r1 * (b.x - a.x) + r2 * (c.x - a.x);
                const targetY = a.y + r1 * (b.y - a.y) + r2 * (c.y - a.y);

                this.behavior.inputManager.movePlayerTo(targetX, targetY, () => {
                    this.exitScene();
                });
            });
        }

        // Cleanup on shutdown
        this.events.on('shutdown', () => {
            this.doorArrow?.destroy();
            if (this.chatBubbleTimer) this.chatBubbleTimer.destroy();
            if (this.cafeMenuPanel) {
                this.cafeMenuPanel.destroy();
                this.cafeMenuPanel = undefined;
            }
            this.behavior.shutdown();
        });
    }

    exitScene() {
        LoadingScreen.getInstance().show('Returning to world...');
        this.behavior.network?.leaveRoom();
        this.scene.start('Scene', {
            reconnect: true,
            playerName: this.behavior.network?.playerName || 'Player',
            roomLabel: this.roomLabel,
            spawnX: 610,
            spawnY: 330
        });
    }

    private setupNpcMenuInteraction() {
        const hollyNpc = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'npc_holly'
        ) as Phaser.GameObjects.Image | undefined;
        const kahnwaldNpc = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'npc_kahnwald'
        ) as Phaser.GameObjects.Image | undefined;

        const makeInteractive = (npc: Phaser.GameObjects.Image, name: string) => {
            npc.setInteractive({ useHandCursor: true });
            npc.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (this.cafeMenuPanel) {
                    this.cafeMenuPanel.show(pointer.x, pointer.y, name);
                }
            });
        };

        if (hollyNpc) makeInteractive(hollyNpc, 'Holly');
        if (kahnwaldNpc) makeInteractive(kahnwaldNpc, 'Kahnwald');
    }

    private startNpcChatLoop() {
        const hollyNpc = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'npc_holly'
        ) as Phaser.GameObjects.Image | undefined;
        const kahnwaldNpc = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'npc_kahnwald'
        ) as Phaser.GameObjects.Image | undefined;

        if (!hollyNpc || !kahnwaldNpc) return;

        const runCycle = () => {
            // Holly bubble at 0s
            const hollyBubble = this.createChatBubble(hollyNpc.x, hollyNpc.y - 60, 'Holly', 'Welcome to Iceberg Cafe.');

            // Remove holly at 5s, show kahnwald
            this.time.delayedCall(5000, () => {
                hollyBubble.destroy();
                const kahnwaldBubble = this.createChatBubble(kahnwaldNpc.x, kahnwaldNpc.y - 60, 'Kahnwald', 'What would you like to do today?');

                // Remove kahnwald at 10s
                this.time.delayedCall(5000, () => {
                    kahnwaldBubble.destroy();
                });
            });

            // Full cycle: 5s holly + 5s kahnwald + 20s pause = 30s
            this.chatBubbleTimer = this.time.delayedCall(30000, runCycle);
        };

        runCycle();
    }

    private createChatBubble(x: number, y: number, name: string, message: string): Phaser.GameObjects.Container {
        const nameText = this.add.text(0, 0, name + ': ', {
            fontFamily: "'Outfit', Arial, sans-serif",
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#dc2626',
        });

        const msgText = this.add.text(nameText.width, 0, message, {
            fontFamily: "'Outfit', Arial, sans-serif",
            fontSize: '10px',
            color: '#334155',
            wordWrap: { width: 160 - nameText.width },
            lineSpacing: 4,
        });

        // Center both texts as a group
        const totalW = nameText.width + msgText.width;
        const totalH = Math.max(nameText.height, msgText.height);
        nameText.setPosition(-totalW / 2, -totalH / 2);
        msgText.setPosition(-totalW / 2 + nameText.width, -totalH / 2);

        const padX = 12;
        const padY = 8;
        const w = totalW + padX * 2;
        const h = totalH + padY * 2;

        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 0.95);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        bg.lineStyle(1, 0xcbd5e1, 1);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

        // Small triangle tail
        bg.fillStyle(0xffffff, 0.95);
        bg.fillTriangle(- 5, h / 2, 5, h / 2, 0, h / 2 + 6);
        bg.lineStyle(1, 0xcbd5e1, 1);
        bg.lineBetween(-5, h / 2, 0, h / 2 + 6);
        bg.lineBetween(0, h / 2 + 6, 5, h / 2);

        const container = this.add.container(x, y, [bg, nameText, msgText]);
        container.setDepth(4000);

        // Fade in
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 300,
            ease: 'Power2',
        });

        return container;
    }

    update(_time: number, delta: number) {
        if (this.behavior) {
            this.behavior.update(delta);
        }
    }
}
