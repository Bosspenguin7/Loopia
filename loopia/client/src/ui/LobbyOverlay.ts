
interface RoomData {
    roomLabel: string;
    displayName: string;
    clients: number;
    maxClients: number;
    roomType: string;
    sceneKey: string;
}

export class LobbyOverlay {
    private container: HTMLDivElement;
    private onJoin: (playerName: string, roomName: string) => void;
    private roomBadges: Map<string, HTMLSpanElement> = new Map();
    private refreshInterval?: number;
    private roomGrid!: HTMLDivElement;
    private nicknameInput!: HTMLInputElement;
    private rooms: RoomData[] = [];
    private roomsLoaded = false;

    constructor(onJoin: (playerName: string, roomName: string) => void, defaultName?: string) {
        this.onJoin = onJoin;
        this.container = document.createElement('div');
        this.createLobbyUI();
        if (defaultName) {
            this.nicknameInput.value = defaultName;
        }
        this.loadRooms();
        this.refreshInterval = window.setInterval(() => this.fetchRoomData(), 10000);
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    private async loadRooms() {
        try {
            const res = await fetch(`${this.getApiBase()}/api/rooms`);
            this.rooms = await res.json();
            this.roomsLoaded = true;
            this.renderRoomButtons();
        } catch {
            // Fallback to hardcoded 10 rooms if API fails
            this.rooms = [];
            for (let i = 1; i <= 10; i++) {
                this.rooms.push({
                    roomLabel: `room_${i}`,
                    displayName: `World ${i}`,
                    clients: 0,
                    maxClients: 50,
                    roomType: "game_room",
                    sceneKey: "Scene",
                });
            }
            this.roomsLoaded = true;
            this.renderRoomButtons();
        }
    }

    private async fetchRoomData() {
        try {
            const res = await fetch(`${this.getApiBase()}/api/rooms`);
            const rooms: RoomData[] = await res.json();

            // Update badges
            for (const r of rooms) {
                const badge = this.roomBadges.get(r.roomLabel);
                if (badge) {
                    badge.textContent = `${r.clients}/${r.maxClients}`;
                    badge.style.display = 'inline-block';
                }
            }

            // If rooms list changed (new rooms added/removed), re-render
            if (!this.roomsLoaded) return;
            if (rooms.length !== this.rooms.length) {
                this.rooms = rooms;
                this.renderRoomButtons();
            }
        } catch {
            // Silently ignore — buttons stay as-is
        }
    }

    private renderRoomButtons() {
        // Clear existing buttons by removing child nodes
        while (this.roomGrid.firstChild) {
            this.roomGrid.removeChild(this.roomGrid.firstChild);
        }
        this.roomBadges.clear();

        for (const room of this.rooms) {
            const roomBtn = document.createElement('button');
            roomBtn.style.cssText = `
                padding: 16px 20px;
                font-size: 16px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                color: #a0a0b0;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
                font-family: 'Outfit', sans-serif;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;

            const label = document.createElement('span');
            label.textContent = room.displayName;
            roomBtn.appendChild(label);

            const badge = document.createElement('span');
            badge.style.cssText = `
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 8px;
                background: rgba(99, 102, 241, 0.2);
                color: #a5b4fc;
                font-weight: 600;
            `;
            badge.textContent = `${room.clients}/${room.maxClients}`;
            roomBtn.appendChild(badge);
            this.roomBadges.set(room.roomLabel, badge);

            roomBtn.onmouseover = () => {
                roomBtn.style.transform = 'translateY(-2px)';
                roomBtn.style.background = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
                roomBtn.style.border = '1px solid transparent';
                roomBtn.style.color = '#fff';
                roomBtn.style.boxShadow = '0 8px 20px -4px rgba(99, 102, 241, 0.5)';
                badge.style.background = 'rgba(255, 255, 255, 0.2)';
                badge.style.color = '#fff';
            };

            roomBtn.onmouseout = () => {
                roomBtn.style.transform = 'translateY(0)';
                roomBtn.style.background = 'rgba(255, 255, 255, 0.03)';
                roomBtn.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                roomBtn.style.color = '#a0a0b0';
                roomBtn.style.boxShadow = 'none';
                badge.style.background = 'rgba(99, 102, 241, 0.2)';
                badge.style.color = '#a5b4fc';
            };

            roomBtn.onclick = () => {
                const name = this.nicknameInput.value.trim();
                if (!name) {
                    this.nicknameInput.style.borderColor = '#ef4444';
                    this.nicknameInput.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
                    this.nicknameInput.animate([
                        { transform: 'translateX(0)' },
                        { transform: 'translateX(-5px)' },
                        { transform: 'translateX(5px)' },
                        { transform: 'translateX(0)' }
                    ], { duration: 300 });

                    setTimeout(() => {
                        this.nicknameInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        this.nicknameInput.style.boxShadow = 'none';
                    }, 1000);
                    return;
                }
                this.joinRoom(name, room.roomLabel);
            };

            this.roomGrid.appendChild(roomBtn);
        }
    }

    private createLobbyUI() {
        this.container.id = 'lobby-overlay';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(15, 15, 20, 0.95), rgba(0, 0, 0, 0.98));
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Outfit', sans-serif;
            color: white;
            backdrop-filter: blur(10px);
        `;

        // Background Glow Effect
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60vw;
            height: 60vh;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(10, 10, 15, 0) 70%);
            border-radius: 50%;
            filter: blur(80px);
            z-index: -1;
            pointer-events: none;
        `;
        this.container.appendChild(glow);

        // Logo Image
        const logo = document.createElement('img');
        logo.src = 'assets/common/logo.png';
        logo.alt = 'LOOPIA Logo';
        logo.style.cssText = `
            width: 180px;
            height: auto;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.6));
            animation: float 6s ease-in-out infinite;
        `;

        // Add float animation keyframes
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            @keyframes float {
                0% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(2deg); }
                100% { transform: translateY(0px) rotate(0deg); }
            }
        `;
        this.container.appendChild(styleSheet);

        this.container.appendChild(logo);

        // Subtitle
        const subtitle = document.createElement('p');
        subtitle.innerText = "Building the Future of Connection";
        subtitle.style.cssText = `
            font-size: 16px;
            color: #a0a0b0;
            margin-bottom: 40px;
            font-weight: 300;
            letter-spacing: 0.05em;
        `;
        this.container.appendChild(subtitle);

        // Nickname Input
        const inputContainer = document.createElement('div');
        inputContainer.style.marginBottom = '40px';
        inputContainer.style.position = 'relative';

        this.nicknameInput = document.createElement('input');
        this.nicknameInput.type = 'text';
        this.nicknameInput.placeholder = 'Enter Username';
        this.nicknameInput.maxLength = 15;
        this.nicknameInput.style.cssText = `
            padding: 16px 24px;
            font-size: 16px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            color: white;
            outline: none;
            width: 320px;
            text-align: center;
            transition: all 0.3s ease;
            font-family: 'Outfit', sans-serif;
            backdrop-filter: blur(10px);
        `;

        this.nicknameInput.onfocus = () => {
            this.nicknameInput.style.borderColor = '#6366f1';
            this.nicknameInput.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            this.nicknameInput.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
        };

        this.nicknameInput.onblur = () => {
            this.nicknameInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            this.nicknameInput.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            this.nicknameInput.style.boxShadow = 'none';
        };

        inputContainer.appendChild(this.nicknameInput);
        this.container.appendChild(inputContainer);

        // Room Grid (will be populated dynamically)
        this.roomGrid = document.createElement('div');
        this.roomGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            width: 500px;
            max-height: 400px;
            overflow-y: auto;
        `;

        this.container.appendChild(this.roomGrid);
        document.body.appendChild(this.container);
    }

    private joinRoom(playerName: string, roomName: string) {
        // Stop polling
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }

        // Fade out lobby
        this.container.style.transition = 'opacity 0.5s ease';
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';

        // Call the join callback
        this.onJoin(playerName, roomName);

        // Remove after fade
        setTimeout(() => this.container.remove(), 500);
    }
}
