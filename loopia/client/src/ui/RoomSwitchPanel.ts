interface RoomData {
    roomLabel: string;
    displayName: string;
    clients: number;
    maxClients: number;
    roomType: string;
    sceneKey: string;
}

export class RoomSwitchPanel {
    private static instance: RoomSwitchPanel | null = null;
    public static onRoomSelect?: (roomLabel: string) => void;

    private overlay: HTMLDivElement;
    private panel: HTMLDivElement;
    private gridContainer!: HTMLDivElement;
    private escHandler: (e: KeyboardEvent) => void;
    private refreshInterval?: number;

    private constructor() {
        this.overlay = document.createElement('div');
        this.panel = document.createElement('div');
        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') this.close();
        };
        this.createUI();
        this.loadRooms();
        this.refreshInterval = window.setInterval(() => this.loadRooms(), 10000);
    }

    public static toggle(): void {
        if (RoomSwitchPanel.instance) {
            RoomSwitchPanel.instance.close();
        } else {
            RoomSwitchPanel.instance = new RoomSwitchPanel();
        }
    }

    public static destroy(): void {
        if (RoomSwitchPanel.instance) {
            RoomSwitchPanel.instance.close();
        }
        RoomSwitchPanel.onRoomSelect = undefined;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes('loopia.world');
        return isProduction ? 'https://server.loopia.world' : 'http://127.0.0.1:2567';
    }

    private async loadRooms() {
        let rooms: RoomData[];
        try {
            const res = await fetch(`${this.getApiBase()}/api/rooms`);
            rooms = await res.json();
        } catch {
            rooms = [];
            for (let i = 1; i <= 10; i++) {
                rooms.push({
                    roomLabel: `room_${i}`,
                    displayName: `World ${i}`,
                    clients: 0,
                    maxClients: 50,
                    roomType: 'game_room',
                    sceneKey: 'Scene',
                });
            }
        }
        this.renderRooms(rooms);
    }

    private createUI(): void {
        // Overlay backdrop
        this.overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 3000;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Outfit', sans-serif;
        `;
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };

        // Panel
        this.panel.style.cssText = `
            background: #1e1e26;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            width: 400px;
            max-height: 70vh;
            overflow-y: auto;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
            color: #e0e0e8;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        `;

        const title = document.createElement('span');
        title.textContent = 'Switch World';
        title.style.cssText = 'font-size: 16px; font-weight: 700; color: #a5b4fc;';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '\u00D7';
        closeBtn.style.cssText = `
            background: none; border: none; color: #808090; font-size: 22px;
            cursor: pointer; padding: 0 4px; line-height: 1;
        `;
        closeBtn.onclick = () => this.close();

        header.appendChild(title);
        header.appendChild(closeBtn);
        this.panel.appendChild(header);

        // Grid container
        this.gridContainer = document.createElement('div');
        this.gridContainer.style.cssText = `
            padding: 16px 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        `;

        // Loading placeholder
        const loading = document.createElement('div');
        loading.textContent = 'Loading worlds...';
        loading.style.cssText = `
            grid-column: 1 / -1; text-align: center;
            color: #808090; font-size: 13px; padding: 20px 0;
        `;
        this.gridContainer.appendChild(loading);

        this.panel.appendChild(this.gridContainer);
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
        document.addEventListener('keydown', this.escHandler);
    }

    private renderRooms(rooms: RoomData[]): void {
        // Clear existing children safely
        while (this.gridContainer.firstChild) {
            this.gridContainer.removeChild(this.gridContainer.firstChild);
        }

        for (const room of rooms) {
            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 12px 14px;
                cursor: pointer;
                transition: all 0.15s ease;
                display: flex;
                flex-direction: column;
                gap: 6px;
            `;

            const name = document.createElement('span');
            name.textContent = room.displayName;
            name.style.cssText = 'font-size: 14px; font-weight: 600; color: #e0e0e8;';

            const badge = document.createElement('span');
            badge.textContent = `${room.clients}/${room.maxClients}`;
            badge.style.cssText = `
                font-size: 11px; font-weight: 600;
                color: ${room.clients >= room.maxClients ? '#f87171' : '#a5b4fc'};
                background: ${room.clients >= room.maxClients ? 'rgba(248,113,113,0.1)' : 'rgba(99,102,241,0.1)'};
                padding: 2px 8px; border-radius: 4px; width: fit-content;
            `;

            card.appendChild(name);
            card.appendChild(badge);

            card.addEventListener('mouseenter', () => {
                card.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))';
                card.style.borderColor = 'rgba(99,102,241,0.3)';
                card.style.transform = 'translateY(-2px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.background = 'rgba(255, 255, 255, 0.04)';
                card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                card.style.transform = '';
            });
            card.addEventListener('click', () => {
                RoomSwitchPanel.onRoomSelect?.(room.roomLabel);
                this.close();
            });

            this.gridContainer.appendChild(card);
        }
    }

    private close(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
        document.removeEventListener('keydown', this.escHandler);
        this.overlay.remove();
        RoomSwitchPanel.instance = null;
    }
}
