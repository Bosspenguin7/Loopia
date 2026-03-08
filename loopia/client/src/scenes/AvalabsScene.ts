import { SceneBehavior } from './SceneBehavior';
import { LoadingScreen } from '../ui/LoadingScreen';
import { NpcProfileCard } from '../ui/NpcProfileCard';
import { createDoorArrow, DoorArrow } from '../ui/DoorArrow';
import avalabs from './avalabs';
import { ROOM_TYPES } from '@shared/constants';

export class AvalabsScene extends avalabs {
    private behavior!: SceneBehavior;
    private roomLabel: string = "";
    private npcProfileCard!: NpcProfileCard;
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
        loading.show('Entering Avalabs...');

        // Editor-generated scene layout
        this.editorCreate();

        // Initialize behavior
        this.behavior = new SceneBehavior(this, {
            cameraBounds: { width: 1200, height: 750 },
            cameraCenter: { x: 600, y: 375 },
            playerScale: 0.15,
            gridSize: { width: 1200, height: 750 },
            soundButtonX: 760,
            obstacleKey: 'avalabs_room',
        });
        this.behavior.initManagers();

        // Connect
        try {
            const playerName = this.behavior.network!.playerName || 'Player';

            // Find spawn point - random position inside door polygon
            const insideDoor = this.children.getByName("avalabs_inside_door") as Phaser.GameObjects.Polygon;
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
                this.behavior.network!.joinRoom(ROOM_TYPES.AVALABS, playerName, this.roomLabel, spawnPos)
            );

            loading.hide();
        } catch (e: any) {
            loading.hide();
        }

        // Sound button


        // NPC Interactions
        this.npcProfileCard = new NpcProfileCard();
        const setupNpc = (textureKey: string, name: string, twitterUsername: string, bio: string) => {
            const npc = this.children.list.find(
                (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === textureKey
            ) as Phaser.GameObjects.Image | undefined;
            if (npc) {
                npc.setInteractive({ useHandCursor: true });
                npc.on('pointerover', () => { npc.setTint(0xddddff); });
                npc.on('pointerout', () => { npc.clearTint(); });
                npc.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    this.npcProfileCard.show(pointer.x, pointer.y, {
                        name,
                        twitterUsername,
                        twitterAvatar: `https://unavatar.io/x/${twitterUsername}`,
                        bio,
                    });
                });
            }
        };

        setupNpc('npc_emin_hoca', 'Emin Gun Sirer', 'el33th4xor',
            'Founder and CEO @avalabs / Ex-prof @Cornell / Ex-co-director @initc3org');
        setupNpc('npc_avery', 'Avery Bartlett', 'avery_bartlett',
            'Power Forward @avax');
        setupNpc('npc_vohvoh', 'VohVoh', 'vohvohh',
            'Idiot @avax / Advisor @xeetdotai / ex @magiceden');

        // Exit Door Interaction
        const exitDoor = this.children.getByName("avalabs_inside_door") as Phaser.GameObjects.Polygon;
        if (exitDoor) {
            exitDoor.setInteractive(new Phaser.Geom.Polygon(exitDoor.geom.points), Phaser.Geom.Polygon.Contains);
            exitDoor.setAlpha(0.01);

            this.doorArrow = createDoorArrow(this, { x: exitDoor.x - 10, y: exitDoor.y + 90, direction: 'left' });

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
            this.npcProfileCard.destroy();
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
            spawnX: 1026 + 65,
            spawnY: 425 + 10
        });
    }

    update(_time: number, delta: number) {
        if (this.behavior) {
            this.behavior.update(delta);
        }
    }
}
