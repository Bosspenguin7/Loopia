import { SceneBehavior } from './SceneBehavior';
import { LoadingScreen } from '../ui/LoadingScreen';
import { NpcProfileCard, NpcData } from '../ui/NpcProfileCard';
import { QuestDialog } from '../ui/QuestDialog';
import { QuestService } from '../services/QuestService';
import { createDoorArrow, DoorArrow } from '../ui/DoorArrow';
import bearsandsalmon from './bearsandsalmon';
import { ROOM_TYPES } from '@shared/constants';

export class BearsAndSalmonScene extends bearsandsalmon {
    private behavior!: SceneBehavior;
    private roomLabel: string = "";
    private npcProfileCard!: NpcProfileCard;
    private questDialog!: QuestDialog;
    private doorArrow?: DoorArrow;
    private wantsExit = false;
    private exitTriggered = false;
    private exitPolyWorldPts: { x: number; y: number }[] = [];
    private questAlert?: Phaser.GameObjects.Image;

    constructor() {
        super();
    }

    init(data: { roomLabel: string }) {
        this.roomLabel = data.roomLabel || "";
    }

    preload() {
        this.load.pack('pack', 'asset-pack.json');
        this.load.image('quest_alert', 'assets/ui/alert.png');
    }

    async create() {
        const loading = LoadingScreen.getInstance();
        loading.show('Entering Bears & Salmon...');

        // Call the editor's create method
        super.create();

        // Initialize behavior
        this.behavior = new SceneBehavior(this, {
            cameraBounds: { width: 1200, height: 750 },
            cameraCenter: { x: 600, y: 375 },
            playerScale: 0.15,
            gridSize: { width: 1200, height: 750 },
            soundButtonX: 1150,
            obstacleKey: 'bears_room',
        });
        this.behavior.initManagers();

        // Connect
        try {
            const playerName = this.behavior.network!.playerName || 'Player';

            // Find spawn point - random position inside door polygon
            const insideDoor = this.children.getByName("bearsandsalmon_inside_door") as Phaser.GameObjects.Polygon;
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
                this.behavior.network!.joinRoom(ROOM_TYPES.BEARS, playerName, this.roomLabel, spawnPos)
            );

            loading.hide();
        } catch (e: any) {
            loading.hide();
        }

        // Sound button


        // NPC Interactions
        this.npcProfileCard = new NpcProfileCard();
        this.questDialog = new QuestDialog();

        const setupNpcPolygon = (polygonName: string, npcData: NpcData) => {
            const poly = this.children.getByName(polygonName) as Phaser.GameObjects.Polygon;
            if (poly) {
                poly.setInteractive(new Phaser.Geom.Polygon(poly.geom.points), Phaser.Geom.Polygon.Contains);
                poly.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
                poly.on('pointerout', () => { this.input.setDefaultCursor('default'); });
                poly.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    this.npcProfileCard.show(pointer.x, pointer.y, npcData);
                });
            }
        };

        // Bears & Salmon picture (bands_picture) interaction
        const bandsImg = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'bands_picture'
        ) as Phaser.GameObjects.Image | undefined;
        if (bandsImg) {
            bandsImg.setInteractive({ useHandCursor: true });
            bandsImg.on('pointerover', () => { bandsImg.setTint(0xddddff); });
            bandsImg.on('pointerout', () => { bandsImg.clearTint(); });
            bandsImg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                this.npcProfileCard.show(pointer.x, pointer.y, {
                    name: 'Bears & Salmon',
                    twitterUsername: 'bears_salmon',
                    twitterAvatar: 'https://unavatar.io/x/bears_salmon',
                    bio: 'Born in the forest, raised on memes. A bear and a salmon retelling #AVAX folklore.',
                });
            });
        }

        setupNpcPolygon('npc_giga', {
            name: 'Giga Alpha',
            twitterUsername: 'giga_alpha',
            twitterAvatar: 'https://unavatar.io/x/giga_alpha',
            bio: 'Building @bears_salmon',
        });

        // Secretsmo NPC — show NpcProfileCard with quest list
        // When quest is selected from NPC card, open QuestDialog
        this.npcProfileCard.onQuestSelect = async (npcQuest) => {
            const quests = await QuestService.getInstance().fetchQuestsForScene("bears_room");
            const quest = quests.find(q => q.id === npcQuest.id);
            if (quest) {
                const progress = await QuestService.getInstance().getQuestProgress(quest.id);
                if (progress) {
                    this.questDialog.show(quest, progress);
                }
            }
        };

        const secretsmoPoly = this.children.getByName('npc_secretsmo') as Phaser.GameObjects.Polygon;
        if (secretsmoPoly) {
            secretsmoPoly.setInteractive(new Phaser.Geom.Polygon(secretsmoPoly.geom.points), Phaser.Geom.Polygon.Contains);
            secretsmoPoly.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
            secretsmoPoly.on('pointerout', () => { this.input.setDefaultCursor('default'); });
            secretsmoPoly.on('pointerdown', async (pointer: Phaser.Input.Pointer) => {
                // Fetch quests and progress for the NPC card
                const quests = await QuestService.getInstance().fetchQuestsForScene("bears_room");
                const npcQuests = await Promise.all(quests.map(async (q) => {
                    const progress = await QuestService.getInstance().getQuestProgress(q.id);
                    return {
                        id: q.id,
                        name: q.name,
                        questKey: q.questKey,
                        completedToday: progress?.completedToday,
                        hasPendingSubmission: progress?.hasPendingSubmission,
                    };
                }));

                this.npcProfileCard.show(pointer.x, pointer.y, {
                    name: 'Secretsmo',
                    twitterUsername: 'Secretsmo0',
                    twitterAvatar: 'https://unavatar.io/x/Secretsmo0',
                    bio: 'Angel / All opinions are my own',
                }, npcQuests);
            });

            // Quest alert icon above Secretsmo NPC
            this.refreshQuestAlert(secretsmoPoly);
        }

        // Exit Door Interaction
        const exitDoor = this.children.getByName("bearsandsalmon_inside_door") as Phaser.GameObjects.Polygon;
        if (exitDoor) {
            exitDoor.setInteractive(new Phaser.Geom.Polygon(exitDoor.geom.points), Phaser.Geom.Polygon.Contains);
            exitDoor.setAlpha(0.01);

            // Cache exit polygon world points for proximity check in update()
            const pts = exitDoor.geom.points;
            this.exitPolyWorldPts = pts.map((p: Phaser.Geom.Point) => ({
                x: exitDoor.x + (p.x - exitDoor.displayOriginX) * exitDoor.scaleX,
                y: exitDoor.y + (p.y - exitDoor.displayOriginY) * exitDoor.scaleY
            }));

            this.doorArrow = createDoorArrow(this, { x: exitDoor.x + 5, y: exitDoor.y + 60, direction: 'left' });

            exitDoor.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                this.doorArrow?.show();
            });

            exitDoor.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                this.doorArrow?.hide();
            });

            exitDoor.on('pointerdown', () => {
                // Flag that the player wants to exit; walk toward the area
                this.wantsExit = true;

                const triIndex = Math.floor(Math.random() * (this.exitPolyWorldPts.length - 2)) + 1;
                const a = this.exitPolyWorldPts[0], b = this.exitPolyWorldPts[triIndex], c = this.exitPolyWorldPts[triIndex + 1];
                let r1 = Math.random(), r2 = Math.random();
                if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
                const targetX = a.x + r1 * (b.x - a.x) + r2 * (c.x - a.x);
                const targetY = a.y + r1 * (b.y - a.y) + r2 * (c.y - a.y);

                this.behavior.inputManager.movePlayerTo(targetX, targetY);
            });

            this.wantsExit = false;
            this.exitTriggered = false;
        }

        // Reset wantsExit if player clicks elsewhere (not the exit door)
        this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
            const clickedExit = exitDoor && currentlyOver.includes(exitDoor);
            if (!clickedExit) {
                this.wantsExit = false;
            }
        });

        // Cleanup on shutdown
        this.events.on('shutdown', () => {
            this.questAlert?.destroy();
            this.doorArrow?.destroy();
            this.npcProfileCard.destroy();
            this.questDialog.destroy();
            this.behavior.shutdown();
        });
    }

    private async refreshQuestAlert(secretsmoPoly: Phaser.GameObjects.Polygon) {
        try {
            const quests = await QuestService.getInstance().fetchQuestsForScene("bears_room");
            const progressList = await Promise.all(
                quests.map(q => QuestService.getInstance().getQuestProgress(q.id))
            );
            const hasAvailable = quests.some((_, i) => {
                const p = progressList[i];
                return p && !p.completedToday && !p.hasPendingSubmission;
            });

            if (hasAvailable && !this.questAlert) {
                // Place alert above the polygon's center
                const alertX = secretsmoPoly.x + 192;
                const alertY = secretsmoPoly.y - 70;
                this.questAlert = this.add.image(alertX, alertY, 'quest_alert');
                this.questAlert.setScale(0.08);
                this.questAlert.setDepth(1000);
                this.tweens.add({
                    targets: this.questAlert,
                    y: alertY - 10,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                });
            } else if (!hasAvailable && this.questAlert) {
                this.questAlert.destroy();
                this.questAlert = undefined;
            }
        } catch (e) {
            // silently ignore
        }
    }

    exitScene() {
        LoadingScreen.getInstance().show('Returning to world...');
        this.behavior.network?.leaveRoom();
        this.scene.start('Scene', {
            reconnect: true,
            playerName: this.behavior.network?.playerName || 'Player',
            roomLabel: this.roomLabel,
            spawnX: 528 + 22,
            spawnY: 213 + 60
        });
    }

    private pointInPolygon(x: number, y: number, pts: { x: number; y: number }[]): boolean {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x, yi = pts[i].y;
            const xj = pts[j].x, yj = pts[j].y;
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    update(time: number, delta: number) {
        super.update(time, delta);
        if (this.behavior) {
            this.behavior.update(delta);
        }

        // Check if player entered exit area after clicking the door
        if (this.wantsExit && !this.exitTriggered && this.exitPolyWorldPts.length > 0) {
            const myEntity = this.behavior.playerManager.getMyPlayer();
            if (myEntity) {
                const px = myEntity.container.x;
                const py = myEntity.container.y;
                if (this.pointInPolygon(px, py, this.exitPolyWorldPts)) {
                    this.exitTriggered = true;
                    this.exitScene();
                }
            }
        }
    }
}
