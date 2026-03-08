import { SceneBehavior } from './SceneBehavior';
import { LoadingScreen } from '../ui/LoadingScreen';
import { createDoorArrow, DoorArrow } from '../ui/DoorArrow';
import SecondScene from './SecondScene';
import { ROOM_TYPES } from '@shared/constants';

export class SecondMapScene extends SecondScene {
    private behavior!: SceneBehavior;
    private roomLabel: string = "";
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
        loading.show('Entering Second Map...');

        // Editor-generated scene layout
        this.editorCreate();

        // Initialize behavior
        this.behavior = new SceneBehavior(this, {
            cameraBounds: { width: 1200, height: 750 },
            cameraCenter: { x: 600, y: 375 },
            playerScale: 0.075,
            gridSize: { width: 1200, height: 750 },
            soundButtonX: 760,
            obstacleKey: 'secondmap_room',
        });
        this.behavior.initManagers();

        // Connect
        try {
            const playerName = this.behavior.network!.playerName || 'Player';

            // Spawn inside portal_scene1 polygon
            const portal = this.children.getByName("portal_scene1") as Phaser.GameObjects.Polygon;
            let spawnPos: { x: number; y: number } | undefined;
            if (portal) {
                const pts = portal.geom.points;
                const worldPts = pts.map((p: Phaser.Geom.Point) => ({
                    x: portal.x + (p.x - portal.displayOriginX) * portal.scaleX,
                    y: portal.y + (p.y - portal.displayOriginY) * portal.scaleY
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
                this.behavior.network!.joinRoom(ROOM_TYPES.SECONDMAP, playerName, this.roomLabel, spawnPos)
            );

            loading.hide();
        } catch (e: any) {
            loading.hide();
        }

        // Portal to Scene 1 — northeast arrow
        const portal = this.children.getByName("portal_scene1") as Phaser.GameObjects.Polygon;
        if (portal) {
            portal.setInteractive(new Phaser.Geom.Polygon(portal.geom.points), Phaser.Geom.Polygon.Contains);
            portal.setAlpha(0.01);

            this.doorArrow = createDoorArrow(this, { x: portal.x + 25, y: portal.y - 20, direction: 'right' });

            portal.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                this.doorArrow?.show();
            });

            portal.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                this.doorArrow?.hide();
            });

            portal.on('pointerdown', () => {
                const pts = portal.geom.points;
                const worldPts = pts.map((p: Phaser.Geom.Point) => ({
                    x: portal.x + (p.x - portal.displayOriginX) * portal.scaleX,
                    y: portal.y + (p.y - portal.displayOriginY) * portal.scaleY
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
            spawnX: 420,
            spawnY: 620
        });
    }

    update(_time: number, delta: number) {
        if (this.behavior) {
            this.behavior.update(delta);
        }
    }
}
