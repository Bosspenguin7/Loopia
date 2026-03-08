import Phaser from 'phaser';
import { Network } from '../services/Network';
import { Room } from 'colyseus.js';
import { PlayerManager } from '../managers/PlayerManager';
import { InputManager } from '../managers/InputManager';
import { ChatOverlay } from '../ui/ChatOverlay';
import { AudioManager } from '../managers/AudioManager';
import { PlayerProfileCard } from '../ui/PlayerProfileCard';
import { FriendListPanel } from '../ui/FriendListPanel';
import { MessengerPanel } from '../ui/MessengerPanel';
import { SocialService } from '../services/SocialService';
import { EconomyService } from '../services/EconomyService';
import { GuestAuth } from '../services/GuestAuth';
import { BottomMenu } from '../ui/BottomMenu';
import { ToastManager } from '../ui/ToastManager';
import { CurrencyBar } from '../ui/CurrencyBar';
import { TradeWindow } from '../ui/TradeWindow';
import { LoadingScreen } from '../ui/LoadingScreen';
import { ShopPanel } from '../ui/ShopPanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { SettingsPanel } from '../ui/SettingsPanel';
import { RoomSwitchPanel } from '../ui/RoomSwitchPanel';
import { QuestPanel } from '../ui/QuestPanel';
import { GameState, Player } from '../schema/GameState';

export interface SceneConfig {
    cameraBounds: { width: number; height: number };
    cameraCenter: { x: number; y: number };
    playerScale?: number;
    gridSize: { width: number; height: number };
    soundButtonX: number;
    ambientSound?: string;
    obstacleKey: string;
}

export class SceneBehavior {
    room?: Room;
    network?: Network;
    playerManager!: PlayerManager;
    inputManager!: InputManager;
    chatOverlay!: ChatOverlay;

    private audioManager!: AudioManager;
    private bottomMenu?: BottomMenu;
    private pendingArrivalCallback?: () => void;
    private lastChatTimestamp: number = 0;
    private lastChatCount: number = 0;
    private initialSyncDone: boolean = false;
    private scene: Phaser.Scene;
    private config: SceneConfig;

    // Social UI
    private profileCard?: PlayerProfileCard;
    private friendListPanel?: FriendListPanel;
    private messengerPanel?: MessengerPanel;
    private toastManager?: ToastManager;
    private currencyBar?: CurrencyBar;
    private tradeWindow?: TradeWindow;

    constructor(scene: Phaser.Scene, config: SceneConfig) {
        this.scene = scene;
        this.config = config;
    }

    /** Initialize all managers, camera, and audio. Call in scene's create(). */
    initManagers() {
        // Isometric depth sorting:
        // - Background (ground, floor, wall, bush, pool): depth -1 (always behind)
        // - Everything else: depth = object Y position (origin point)
        //   This works because in isometric view, objects lower on screen (higher Y)
        //   are "closer to camera" and should render on top.
        //   Player depth also uses Y, so the comparison is consistent.
        const BG_KEYS = ['ground', 'floor', 'wall', 'bush', 'pool', 'houses', 'l1_', 'picture'];
        this.scene.children.each((child: any) => {
            if (!child || typeof child.y !== 'number' || typeof child.setDepth !== 'function') return;
            const key: string = child.texture?.key || child.name || '';

            const isBg = BG_KEYS.some(k => key.includes(k));
            if (isBg) {
                child.setDepth(-1);
            } else if (key.includes('npc_holly') || key.includes('npc_kahnwald')) {
                // Ensure cafe NPCs always render in front of the bar despite their origin Y
                child.setDepth(3000);
            } else {
                // Isometric depth: x + 2*y (camera proximity in 2:1 iso view)
                child.setDepth(child.x + 2 * child.y);
            }
        });

        this.lastChatTimestamp = 0;
        this.lastChatCount = 0;

        this.network = Network.getInstance();

        this.playerManager = new PlayerManager(this.scene, this.config.playerScale);

        this.chatOverlay = new ChatOverlay((msg) => {
            this.network?.sendChat(msg);
        });

        // Wire whisper send callbacks
        this.chatOverlay.onWhisperSend = (targetSessionId, message) => {
            const activeRoom = this.room;
            if (activeRoom && activeRoom.connection.isOpen) {
                activeRoom.send("whisper", { targetSessionId, message });
            }
        };

        this.chatOverlay.onCrossRoomWhisperSend = (targetGuestId, message) => {
            const activeRoom = this.room;
            if (activeRoom && activeRoom.connection.isOpen) {
                activeRoom.send("whisperCrossRoom", { targetGuestId, message });
            }
        };

        // Profile card (replaces old context menu)
        this.profileCard = new PlayerProfileCard();
        this.profileCard.onWhisper = (sessionId, name) => {
            this.chatOverlay.setWhisperMode(name, sessionId);
        };
        this.profileCard.onAddFriend = async (guestId, name) => {
            try {
                await SocialService.getInstance().sendFriendRequest(guestId);
                this.chatOverlay.addMessage("System", `Friend request sent to ${name}!`, true);
            } catch (e: any) {
                this.chatOverlay.addMessage("System", e.message || "Failed to send request", true);
            }
        };
        this.profileCard.onUnfriend = async (guestId) => {
            try {
                await SocialService.getInstance().removeFriend(guestId);
                this.chatOverlay.addMessage("System", "Friend removed.", true);
            } catch (e: any) {
                this.chatOverlay.addMessage("System", e.message || "Failed to remove friend", true);
            }
        };
        this.profileCard.onVisitRoom = (roomLabel) => {
            this.navigateToRoom(roomLabel);
        };
        this.profileCard.onBlock = async (guestId, name) => {
            try {
                await SocialService.getInstance().blockPlayer(guestId);
                this.toastManager?.show(`${name} engellendi.`, 'success');
            } catch (e: any) {
                this.toastManager?.show(e.message || 'Engelleme başarısız', 'error');
            }
        };
        this.profileCard.onGiveRespect = async (guestId, name) => {
            try {
                await SocialService.getInstance().giveRespect(guestId);
                this.toastManager?.show(`${name} adlı oyuncuya respect gönderdin! ❤️`, 'success');
            } catch (e: any) {
                this.toastManager?.show(e.message || 'Respect gönderilemedi', 'error');
            }
        };
        this.profileCard.onTrade = (sessionId, _guestId, _name) => {
            Network.getInstance().sendTradeRequest(sessionId);
        };

        // Trade window
        this.tradeWindow = new TradeWindow();

        // Player click handler
        this.playerManager.onPlayerClicked = (sessionId, guestId, _playerName) => {
            // Get player entity for screen position
            const entity = this.playerManager.getPlayerEntity(sessionId);
            if (!entity) return;

            // World → screen coordinate conversion
            const cam = this.scene.cameras.main;
            const screenX = (entity.container.x - cam.scrollX) * cam.zoom;
            const screenY = (entity.container.y - cam.scrollY) * cam.zoom;

            const isSelf = this.room ? sessionId === this.room.sessionId : false;
            const myGuestId = GuestAuth.getInstance().getGuestId();
            const targetGuestId = isSelf ? (myGuestId || 0) : guestId;

            if (targetGuestId <= 0) return;

            this.profileCard?.show(screenX, screenY, targetGuestId, isSelf ? undefined : sessionId, isSelf);
        };

        // Friend list panel
        this.friendListPanel = new FriendListPanel();
        this.friendListPanel.onWhisperFriend = (guestId, displayName) => {
            this.chatOverlay.setWhisperModeCrossRoom(guestId, displayName);
        };
        this.friendListPanel.onVisitFriend = (roomLabel) => {
            this.navigateToRoom(roomLabel);
        };

        // Camera setup
        this.scene.cameras.main.setBackgroundColor('#0f0e1d');
        this.scene.cameras.main.roundPixels = true;
        this.scene.cameras.main.setZoom(1);
        this.scene.cameras.main.centerOn(this.config.cameraCenter.x, this.config.cameraCenter.y);

        // Zoom controls (top-left)
        this.createZoomControls();

        // Toast notifications
        this.toastManager = ToastManager.getInstance();

        // Audio
        this.audioManager = AudioManager.getInstance();
        this.audioManager.init(this.scene);
        if (this.config.ambientSound) {
            this.audioManager.playAmbient(this.config.ambientSound);
        }

        // Bottom Menu
        this.bottomMenu = new BottomMenu(this.scene, {
            onInventory: () => { InventoryPanel.toggle(); },
            onRoomSwitch: () => {
                RoomSwitchPanel.onRoomSelect = (roomLabel) => this.navigateToRoom(roomLabel);
                RoomSwitchPanel.toggle();
            },
            onFriends: () => {
                this.messengerPanel?.hide();
                this.friendListPanel?.toggle();
            },
            onChat: () => {
                this.friendListPanel?.hide();
                this.messengerPanel?.toggle();
            },
            onMood: () => { /* placeholder */ },
            onShop: () => { ShopPanel.toggle(); },
            onQuests: () => { QuestPanel.toggle(); },
            onSoundToggle: () => {
                const isMuted = !this.audioManager.toggle();
                this.bottomMenu?.updateSoundIcon(isMuted);
            },
            onExitToLobby: () => {
                this.network?.leaveRoom();
                window.location.reload();
            },
            onSettings: () => { SettingsPanel.toggle(); },
        });

        // Wire chat input from BottomMenu into ChatOverlay
        this.chatOverlay.attachToBottomMenu(
            this.bottomMenu.getChatInput(),
            this.bottomMenu.getEmojiBtn(),
            this.scene
        );

        // Messenger panel
        const myGuestId = GuestAuth.getInstance().getGuestId();
        if (myGuestId) {
            this.messengerPanel = new MessengerPanel(myGuestId);
            this.messengerPanel.onUnreadChange = (count) => {
                this.bottomMenu?.updateMessengerBadge(count);
            };
            // Check for unread on startup
            this.messengerPanel.checkUnread().then((count) => {
                if (count > 0) {
                    this.chatOverlay.addMessage("System", `You have ${count} unread message(s)!`, true);
                    this.bottomMenu?.updateMessengerBadge(count);
                }
            });
        }

        // Currency bar
        this.currencyBar = new CurrencyBar(this.scene);
    }

    /** Connect to a room. joinFn returns the room from the appropriate Network method. */
    async connectToRoom(joinFn: () => Promise<Room>): Promise<void> {
        try {
            this.room = await joinFn();

            if (this.room) {
                this.playerManager.setMySessionId(this.room.sessionId);
            }

            this.setupRoomListeners();
            this.setupReconnectUI();

            // Setup Input Manager — sends moveRequest to server
            this.inputManager = new InputManager(
                this.scene,
                this.room!,
                (_targetX, _targetY, onReached) => {
                    this.pendingArrivalCallback = onReached;
                }
            );
            this.inputManager.setupGrid(this.config.gridSize.width, this.config.gridSize.height, this.scene.children.list);
            this.inputManager.enableInput();

        } catch (e: any) {
            console.error('Connection Error:', e.message || e);
            throw e;
        }
    }

    private setupRoomListeners() {
        if (!this.room) return;

        this.room.onStateChange((state: GameState) => {
            if (!state) return;

            // Sync Players
            if (state.players) {
                this.playerManager.syncPlayers(state.players);
            }

            // Sync Chat — use last message timestamp to detect new messages
            if (state.messages && state.messages.length > 0) {
                const count = state.messages.length;
                const lastMsg = state.messages[count - 1];
                const lastTs = lastMsg.timestamp;

                if (!this.initialSyncDone) {
                    // First sync: load existing messages into overlay only (no bubbles)
                    for (let i = 0; i < count; i++) {
                        const msg = state.messages[i];
                        this.chatOverlay.addMessage(msg.sender, msg.message, msg.sender === 'System');
                    }
                    this.lastChatTimestamp = lastTs;
                    this.lastChatCount = count;
                    this.initialSyncDone = true;
                } else if (lastTs !== this.lastChatTimestamp || count !== this.lastChatCount) {
                    // Find new messages: walk backwards from end to find ones we haven't seen
                    let newStart = count;
                    for (let i = count - 1; i >= 0; i--) {
                        if (state.messages[i].timestamp <= this.lastChatTimestamp) {
                            break;
                        }
                        newStart = i;
                    }

                    for (let i = newStart; i < count; i++) {
                        const msg = state.messages[i];
                        const isSystem = msg.sender === 'System';

                        this.chatOverlay.addMessage(msg.sender, msg.message, isSystem);

                        if (!isSystem) {
                            state.players.forEach((player: Player, sessionId: string) => {
                                if (player.name === msg.sender) {
                                    this.playerManager.showChatBubble(sessionId, msg.message);
                                }
                            });
                        }
                    }

                    this.lastChatTimestamp = lastTs;
                    this.lastChatCount = count;
                }
            }
        });

        // Server signals path completion — fire the pending arrival callback (door transitions etc.)
        this.room.onMessage("moveComplete", () => {
            if (this.pendingArrivalCallback) {
                const cb = this.pendingArrivalCallback;
                this.pendingArrivalCallback = undefined;
                cb();
            }
        });

        // Admin system message broadcast
        this.room.onMessage("systemMessage", (data: { message: string }) => {
            if (data.message) {
                this.chatOverlay.addMessage("System", data.message, true);
            }
        });

        // Banned notification
        this.room.onMessage("banned", (data: { reason: string }) => {
            const reason = data.reason || "You have been banned.";
            alert(reason);
        });

        // ──────────── Social message handlers ────────────

        // Same-room whisper received
        this.room.onMessage("whisper", (data: any) => {
            this.chatOverlay.addWhisper(data.senderName, data.message, 'received');
            if (data.senderSessionId) {
                this.playerManager.showWhisperBubble(data.senderSessionId, data.message);
            }
        });

        // Whisper sent confirmation
        this.room.onMessage("whisperSent", (data: any) => {
            const name = data.targetName || `Guest${data.targetGuestId || ''}`;
            this.chatOverlay.addWhisper(name, data.message, 'sent');
        });

        // Whisper offline — message saved as DM
        this.room.onMessage("whisperOffline", (data: any) => {
            const name = data.targetName || `Guest${data.targetGuestId || ''}`;
            this.chatOverlay.addWhisper(name, data.message, 'sent');
            this.chatOverlay.addMessage("System", `${name} is offline. Message saved!`, true);
        });

        // Whisper error
        this.room.onMessage("whisperError", (data: any) => {
            this.chatOverlay.addMessage("System", data.error || "Whisper failed", true);
        });

        // Friend request received
        this.room.onMessage("friendRequest", (data: any) => {
            this.chatOverlay.addMessage("System", `${data.displayName} sent you a friend request!`, true);
            this.toastManager?.show(`${data.displayName} sana arkadaşlık isteği gönderdi!`, 'info');
        });

        // Friend request accepted
        this.room.onMessage("friendRequestAccepted", (data: any) => {
            this.chatOverlay.addMessage("System", `${data.displayName} accepted your friend request!`, true);
            this.toastManager?.show(`${data.displayName} arkadaşlık isteğini kabul etti!`, 'success');
        });

        // Respect received
        this.room.onMessage("respectReceived", (data: any) => {
            this.toastManager?.show(`${data.fromName} sana respect gönderdi! ❤️`, 'success');
        });

        // ──────────── Economy message handlers ────────────

        // Balance update (sent on join + after admin grant)
        this.room.onMessage("balanceUpdate", (data: any) => {
            EconomyService.getInstance().updateBalance(data);
        });

        // Level-up notification
        this.room.onMessage("levelUpdate", (data: any) => {
            if (data.leveledUp) {
                this.showLevelUpOverlay(data.level);
            }
        });

        // Daily login reward
        this.room.onMessage("dailyLoginReward", (data: any) => {
            this.toastManager?.show(
                `Daily reward: Gün ${data.streakDay}: +${data.loopiEarned} Loopi 🎁`,
                'success'
            );
            EconomyService.getInstance().fetchBalance().catch(() => { });
        });

        // Direct message received (cross-room or offline delivery)
        this.room.onMessage("directMessage", (data: any) => {
            this.chatOverlay.addWhisper(data.senderName, data.message, 'received');
            if (this.messengerPanel) {
                this.messengerPanel.handleIncomingDM(data.senderId, data.senderName, data.message);
            }
            // Toast if messenger panel is hidden
            if (!this.messengerPanel || !document.getElementById('messenger-panel') ||
                document.getElementById('messenger-panel')?.style.display === 'none') {
                this.toastManager?.show(`${data.senderName} yeni mesaj gönderdi`, 'info');
            }
        });

        // ──────────── Trade message handlers ────────────

        // Incoming trade request — centered modal
        this.room.onMessage("tradeIncoming", (data: any) => {
            this.tradeWindow?.showIncomingRequest(
                data.fromName,
                () => Network.getInstance().sendTradeAccept(),
                () => Network.getInstance().sendTradeDecline()
            );
        });

        // Sender got confirmation that request was sent — show pending modal
        this.room.onMessage("tradeRequestSent", (data: any) => {
            this.tradeWindow?.showPendingRequest(
                data.targetName,
                () => Network.getInstance().sendTradeCancel()
            );
        });

        // Request expired (timeout)
        this.room.onMessage("tradeRequestExpired", () => {
            this.tradeWindow?.hideRequestModal();
            this.toastManager?.show('Trade request expired', 'warning');
        });

        // Request declined by target
        this.room.onMessage("tradeRequestDeclined", () => {
            this.tradeWindow?.hideRequestModal();
            this.toastManager?.show('Trade request declined', 'warning');
        });

        // Incoming request was cancelled by sender
        this.room.onMessage("tradeIncomingCancelled", () => {
            this.tradeWindow?.hideRequestModal();
        });

        // Trade started
        this.room.onMessage("tradeStarted", (data: any) => {
            this.tradeWindow?.show(data.partnerName, data.partnerSessionId, this.room!.sessionId);
        });

        // Partner updated their offer
        this.room.onMessage("tradeOfferUpdated", (data: any) => {
            this.tradeWindow?.updatePartnerOffer(data.loopi);
        });

        // Ready state changed
        this.room.onMessage("tradeReadyChanged", (data: any) => {
            this.tradeWindow?.updateReadyState(data.sessionId, data.isReady);
        });

        // Countdown tick
        this.room.onMessage("tradeCountdown", (data: any) => {
            this.tradeWindow?.showCountdown(data.remaining);
        });

        // Trade completed
        this.room.onMessage("tradeCompleted", (data: any) => {
            this.tradeWindow?.hide();
            const parts: string[] = [];
            if (data.gained.loopi > 0) parts.push(`+${data.gained.loopi} Loopi`);
            if (data.lost.loopi > 0) parts.push(`-${data.lost.loopi} Loopi`);
            this.toastManager?.show(`Trade completed! ${parts.join(', ')}`, 'success');
            EconomyService.getInstance().updateBalance(data.balance);
        });

        // Trade cancelled
        this.room.onMessage("tradeCancelled", (data: any) => {
            this.tradeWindow?.hide();
            this.toastManager?.show(data.reason || 'Trade cancelled', 'warning');
        });

        // Trade error
        this.room.onMessage("tradeError", (data: any) => {
            this.toastManager?.show(data.error || 'Trade error', 'error');
        });
    }

    /** Wire Network reconnection callbacks to show/hide UI overlay */
    private setupReconnectUI() {
        const network = Network.getInstance();
        const loading = LoadingScreen.getInstance();

        network.onReconnectStart = () => {
            loading.show('Connection lost. Reconnecting...');
        };

        network.onReconnectAttempt = (attempt, maxAttempts) => {
            loading.show(`Reconnecting... (${attempt}/${maxAttempts})`);
        };

        network.onReconnectSuccess = () => {
            loading.show('Reconnected!');
            // Re-attach room listeners for the new room reference
            this.room = network.activeRoom;
            if (this.room) {
                this.playerManager.setMySessionId(this.room.sessionId);
                this.setupRoomListeners();
            }
            setTimeout(() => loading.hide(), 1000);
        };

        network.onReconnectFail = () => {
            loading.show('Connection failed. Returning to lobby...');
            setTimeout(() => {
                loading.hide();
                this.scene.scene.start('Scene', { reconnect: false });
            }, 2000);
        };
    }

    private showLevelUpOverlay(level: number) {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position:fixed;inset:0;z-index:5000;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.5);
            font-family:'Outfit',sans-serif;
            animation:fadeIn 0.3s ease;
            pointer-events:none;
        `;
        const box = document.createElement("div");
        box.style.cssText = `
            text-align:center;padding:32px 48px;
            background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);
            border-radius:16px;border:2px solid rgba(255,255,255,0.2);
            box-shadow:0 0 60px rgba(99,102,241,0.4);
            transform:scale(0);animation:popIn 0.4s ease 0.1s forwards;
        `;
        const label = document.createElement("div");
        label.textContent = "LEVEL UP!";
        label.style.cssText = `font-size:14px;color:rgba(255,255,255,0.7);letter-spacing:3px;margin-bottom:4px;`;
        const lvl = document.createElement("div");
        lvl.textContent = `Level ${level}`;
        lvl.style.cssText = `font-size:36px;font-weight:800;color:#fff;`;
        box.appendChild(label);
        box.appendChild(lvl);
        overlay.appendChild(box);

        const style = document.createElement("style");
        style.textContent = `
            @keyframes popIn{0%{transform:scale(0)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        `;
        overlay.appendChild(style);
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.transition = "opacity 0.5s";
            overlay.style.opacity = "0";
            setTimeout(() => overlay.remove(), 500);
        }, 3000);
    }

    private zoomEl?: HTMLDivElement;
    private zoomResizeHandler?: () => void;
    private zoomResizeObserver?: ResizeObserver;
    private zoomSteps = 0;
    private readonly maxZoomSteps = 3;

    private createZoomControls() {
        document.getElementById('zoom-controls')?.remove();
        this.zoomSteps = 0;
        const baseZoom = this.scene.cameras.main.zoom;

        const wrap = document.createElement('div');
        wrap.id = 'zoom-controls';
        wrap.style.cssText = 'position:absolute;z-index:1000;display:flex;flex-direction:row;gap:6px;align-items:center;';

        const makeBtn = (src: string, cb: () => void) => {
            const btn = document.createElement('img');
            btn.src = src;
            btn.style.cssText = 'width:40px;height:40px;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));transition:transform 0.15s ease;';
            btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
            btn.onmouseleave = () => btn.style.transform = 'scale(1)';
            btn.onclick = cb;
            return btn;
        };

        wrap.appendChild(makeBtn('assets/ui/zoom_in.png', () => {
            if (this.zoomSteps >= this.maxZoomSteps) return;
            const cam = this.scene.cameras.main;
            cam.setZoom(cam.zoom + 0.25);
            this.zoomSteps++;
        }));
        wrap.appendChild(makeBtn('assets/ui/zoom_out.png', () => {
            if (this.zoomSteps <= 0) return;
            const cam = this.scene.cameras.main;
            cam.setZoom(Math.max(cam.zoom - 0.25, baseZoom));
            this.zoomSteps--;
        }));

        document.body.appendChild(wrap);
        this.zoomEl = wrap;

        const reposition = () => {
            const canvas = this.scene.game.canvas;
            const rect = canvas.getBoundingClientRect();
            wrap.style.top = `${rect.top + 12}px`;
            wrap.style.left = `${rect.left + 12}px`;
        };

        reposition();
        this.zoomResizeHandler = reposition;
        window.addEventListener('resize', reposition);

        const canvas = this.scene.game.canvas;
        if (canvas.parentElement) {
            this.zoomResizeObserver = new ResizeObserver(reposition);
            this.zoomResizeObserver.observe(canvas.parentElement);
        }
    }

    /** Navigate to a friend's room by roomLabel */
    async navigateToRoom(roomLabel: string) {
        try {
            // Fetch room list to find sceneKey
            const network = Network.getInstance();
            const isProduction = window.location.hostname.includes("loopia.world");
            const apiBase = isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
            const res = await fetch(`${apiBase}/api/rooms`);
            const rooms = await res.json();

            const targetRoom = rooms.find((r: any) => r.roomLabel === roomLabel);
            if (!targetRoom) {
                this.chatOverlay.addMessage("System", "World not found!", true);
                return;
            }

            const playerName = network.playerName;
            const sceneKey = targetRoom.sceneKey;

            // Start the target scene with reconnect data
            this.scene.scene.start(sceneKey, {
                reconnect: true,
                playerName,
                roomLabel,
            });
        } catch (e) {
            console.warn("[SceneBehavior] navigateToRoom failed:", e);
            this.chatOverlay.addMessage("System", "Failed to teleport!", true);
        }
    }

    /** Call in scene's update(). */
    update(delta: number) {
        this.playerManager.update(delta);
    }

    /** Call in scene's shutdown event. */
    shutdown() {
        // Clear reconnection callbacks to prevent stale scene references
        const network = Network.getInstance();
        network.onReconnectStart = undefined;
        network.onReconnectAttempt = undefined;
        network.onReconnectSuccess = undefined;
        network.onReconnectFail = undefined;

        this.inputManager?.disableInput();
        this.chatOverlay?.destroy();
        this.profileCard?.destroy();
        this.friendListPanel?.destroy();
        this.messengerPanel?.destroy();
        this.tradeWindow?.destroy();
        ShopPanel.destroy();
        InventoryPanel.destroy();
        QuestPanel.destroy();
        RoomSwitchPanel.destroy();
        this.bottomMenu?.destroy();
        this.toastManager?.destroy();
        this.currencyBar?.destroy();
        if (this.zoomResizeHandler) window.removeEventListener('resize', this.zoomResizeHandler);
        this.zoomResizeObserver?.disconnect();
        this.zoomEl?.remove();
        if (this.config.ambientSound) {
            this.audioManager.stopAmbient();
        }
    }
}
