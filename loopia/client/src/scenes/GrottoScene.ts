import { SceneBehavior } from './SceneBehavior';
import { LoadingScreen } from '../ui/LoadingScreen';
import { NpcProfileCard } from '../ui/NpcProfileCard';
import { PortalPanel } from '../ui/PortalPanel';
import { QuestDialog } from '../ui/QuestDialog';
import { QuestService } from '../services/QuestService';
import { createDoorArrow, DoorArrow } from '../ui/DoorArrow';
import grotto from './grotto';
import { ROOM_TYPES } from '@shared/constants';

export class GrottoScene extends grotto {
    private behavior!: SceneBehavior;
    private roomLabel: string = "";
    private npcProfileCard!: NpcProfileCard;
    private portalPanel!: PortalPanel;
    private questDialog!: QuestDialog;
    private doorArrow?: DoorArrow;
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
        loading.show('Entering Grotto...');

        // Editor-generated scene layout
        this.editorCreate();

        // Initialize behavior
        this.behavior = new SceneBehavior(this, {
            cameraBounds: { width: 1200, height: 750 },
            cameraCenter: { x: 600, y: 375 },
            playerScale: 0.15,
            gridSize: { width: 1200, height: 750 },
            soundButtonX: 760,
            obstacleKey: 'grotto_room',
        });
        this.behavior.initManagers();

        // Connect
        try {
            const playerName = this.behavior.network!.playerName || 'Player';

            // Spawn near the exit door — fixed safe position (walkable area)
            // (370,520) was inside obs_grotto_left_outside; moved to clear walkable tile
            const spawnPos = { x: 410, y: 510 };

            await this.behavior.connectToRoom(() =>
                this.behavior.network!.joinRoom(ROOM_TYPES.GROTTO, playerName, this.roomLabel, spawnPos)
            );

            loading.hide();
        } catch (e: any) {
            loading.hide();
        }

        // NPC Wrath Interaction — NpcProfileCard with Quests list
        this.npcProfileCard = new NpcProfileCard();
        this.questDialog = new QuestDialog();

        // When a quest is selected from the NPC card, open QuestDialog
        this.npcProfileCard.onQuestSelect = async (npcQuest) => {
            const quests = await QuestService.getInstance().fetchQuestsForScene("grotto_room");
            const quest = quests.find(q => q.id === npcQuest.id);
            if (quest) {
                const progress = await QuestService.getInstance().getQuestProgress(quest.id);
                if (progress) {
                    this.questDialog.show(quest, progress);
                }
            }
        };

        const wrathNpc = this.children.list.find(
            (c) => c instanceof Phaser.GameObjects.Image && (c as Phaser.GameObjects.Image).texture.key === 'npc_wrath'
        ) as Phaser.GameObjects.Image | undefined;
        if (wrathNpc) {
            wrathNpc.setInteractive({ useHandCursor: true });
            wrathNpc.on('pointerover', () => { wrathNpc.setTint(0xddddff); });
            wrathNpc.on('pointerout', () => { wrathNpc.clearTint(); });
            wrathNpc.on('pointerdown', async (pointer: Phaser.Input.Pointer) => {
                // Fetch quests and progress for the NPC card
                const quests = await QuestService.getInstance().fetchQuestsForScene("grotto_room");
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
                    name: 'Wrath',
                    twitterUsername: 'Wrathtank_avax',
                    twitterAvatar: 'https://unavatar.io/x/Wrathtank_avax',
                    bio: 'Founder of @TheGrottoL1 / NFT: Analog Distortions. / $HERESY is gas for the Grotto. / PFP is Bob from The Grotto.',
                }, npcQuests);
            });

            // Quest alert icon above Wrath NPC
            this.refreshQuestAlert(wrathNpc);
        }

        // Portal Door Interaction
        this.portalPanel = new PortalPanel();
        const portalPoly = this.children.getByName("portal_grotto_games") as Phaser.GameObjects.Polygon;
        if (portalPoly) {
            portalPoly.setInteractive(new Phaser.Geom.Polygon(portalPoly.geom.points), Phaser.Geom.Polygon.Contains);
            portalPoly.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
            portalPoly.on('pointerout', () => { this.input.setDefaultCursor('default'); });
            portalPoly.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                this.portalPanel.show(pointer.x, pointer.y, {
                    title: 'The Grotto',
                    description: 'Enter the Grotto Games portal and explore what awaits inside.',
                    linkUrl: 'https://www.enterthegrotto.xyz/games',
                    linkLabel: 'Enter the Grotto Games',
                });
            });
        }

        // Exit Door Interaction
        const exitDoor = this.children.getByName("grotto_inside_door") as Phaser.GameObjects.Polygon;
        if (exitDoor) {
            exitDoor.setInteractive(new Phaser.Geom.Polygon(exitDoor.geom.points), Phaser.Geom.Polygon.Contains);
            exitDoor.setAlpha(0.01);

            this.doorArrow = createDoorArrow(this, { x: exitDoor.x, y: exitDoor.y + 140, direction: 'left' });

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
            this.questAlert?.destroy();
            this.doorArrow?.destroy();
            this.npcProfileCard.destroy();
            this.portalPanel.destroy();
            this.questDialog.destroy();
            this.behavior.shutdown();
        });
    }

    private async refreshQuestAlert(wrathNpc: Phaser.GameObjects.Image) {
        try {
            const quests = await QuestService.getInstance().fetchQuestsForScene("grotto_room");
            const progressList = await Promise.all(
                quests.map(q => QuestService.getInstance().getQuestProgress(q.id))
            );
            // Show alert if any quest is available (not completed today and not pending)
            const hasAvailable = quests.some((_, i) => {
                const p = progressList[i];
                return p && !p.completedToday && !p.hasPendingSubmission;
            });

            if (hasAvailable && !this.questAlert) {
                this.questAlert = this.add.image(wrathNpc.x, wrathNpc.y - 80, 'quest_alert');
                this.questAlert.setScale(0.08);
                this.questAlert.setDepth(1000);
                this.tweens.add({
                    targets: this.questAlert,
                    y: wrathNpc.y - 90,
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
            spawnX: 876,
            spawnY: 300
        });
    }

    update(_time: number, delta: number) {
        if (this.behavior) {
            this.behavior.update(delta);
        }
    }
}
