export interface NpcData {
    name: string;
    twitterUsername: string;
    twitterAvatar?: string;
    bio?: string;
}

export interface NpcQuest {
    id: number;
    name: string;
    questKey: string;
    completedToday?: boolean;
    hasPendingSubmission?: boolean;
}

export class NpcProfileCard {
    private container: HTMLDivElement;
    private header: HTMLDivElement;
    private contentWrap: HTMLDivElement;

    /** Fired when user clicks a quest in the NPC card */
    public onQuestSelect?: (quest: NpcQuest) => void;

    // Drag state
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private initialLeft = 0;
    private initialTop = 0;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'npc-profile-card';

        this.container.style.cssText = `
            position: absolute;
            display: none;
            width: 280px;
            background: #ffffff;
            border-radius: 12px;
            font-family: 'Outfit', Arial, sans-serif;
            z-index: 3500;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            user-select: none;
            flex-direction: column;
        `;
        document.body.appendChild(this.container);

        // Header / Drag Handle
        this.header = document.createElement('div');
        this.header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            cursor: grab;
        `;

        this.contentWrap = document.createElement('div');
        this.container.appendChild(this.header);
        this.container.appendChild(this.contentWrap);

        this.setupDragging();

        // Block game input
        this.container.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });

        // Close on outside click
        document.addEventListener('pointerdown', (e) => {
            if (this.container.style.display !== 'none' && !this.container.contains(e.target as Node)) {
                this.hide();
            }
        });
    }

    private setupDragging() {
        this.header.addEventListener('pointerdown', (e) => {
            if ((e.target as HTMLElement).textContent === '\u2716') return;

            this.isDragging = true;
            this.header.style.cursor = 'grabbing';
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            const rect = this.container.getBoundingClientRect();
            this.container.style.transform = 'none';
            this.container.style.left = rect.left + 'px';
            this.container.style.top = rect.top + 'px';
            this.initialLeft = rect.left;
            this.initialTop = rect.top;

            this.header.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        this.header.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            this.container.style.left = `${this.initialLeft + dx}px`;
            this.container.style.top = `${this.initialTop + dy}px`;
        });

        this.header.addEventListener('pointerup', (e) => {
            this.isDragging = false;
            this.header.style.cursor = 'grab';
            this.header.releasePointerCapture(e.pointerId);
        });

        this.header.addEventListener('pointercancel', (e) => {
            this.isDragging = false;
            this.header.style.cursor = 'grab';
            this.header.releasePointerCapture(e.pointerId);
        });
    }

    public show(screenX: number, screenY: number, npc: NpcData, quests?: NpcQuest[]): void {
        this.renderCard(npc, quests);
        this.container.style.display = 'flex';
        this.positionCard(screenX, screenY);
    }

    public hide(): void {
        this.container.style.display = 'none';
    }

    public destroy(): void {
        this.container.remove();
    }

    private renderCard(npc: NpcData, quests?: NpcQuest[]): void {
        // Header
        this.header.textContent = '';

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const npcBadge = document.createElement('div');
        npcBadge.style.cssText = `
            padding: 2px 8px;
            background: #7c3aed;
            color: white;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
        `;
        npcBadge.textContent = 'NPC';

        const titleText = document.createElement('div');
        titleText.style.cssText = `
            font-weight: 800;
            font-size: 16px;
            color: #0f172a;
            max-width: 160px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        titleText.textContent = npc.name;

        leftGroup.appendChild(npcBadge);
        leftGroup.appendChild(titleText);

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '\u2716';
        closeBtn.style.cssText = `
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ef4444;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2);
            transition: transform 0.1s;
        `;
        closeBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            closeBtn.style.transform = 'translateY(2px)';
        });
        closeBtn.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            closeBtn.style.transform = 'translateY(0)';
            this.hide();
        });
        closeBtn.addEventListener('pointerleave', (e) => {
            e.stopPropagation();
            closeBtn.style.transform = 'translateY(0)';
        });

        this.header.appendChild(leftGroup);
        this.header.appendChild(closeBtn);

        // Content
        while (this.contentWrap.firstChild) {
            this.contentWrap.removeChild(this.contentWrap.firstChild);
        }

        // Twitter Profile Picture
        if (npc.twitterAvatar) {
            const imageWrap = document.createElement('div');
            imageWrap.style.cssText = `
                padding: 16px;
                display: flex;
                justify-content: center;
                background: #ffffff;
            `;

            const img = document.createElement('img');
            img.src = npc.twitterAvatar;
            img.style.cssText = `
                width: 96px;
                height: 96px;
                border-radius: 50%;
                border: 3px solid #1d9bf0;
                object-fit: cover;
                background: #f8fafc;
            `;
            img.onerror = () => { img.style.display = 'none'; };
            imageWrap.appendChild(img);
            this.contentWrap.appendChild(imageWrap);
        }

        // Bio
        if (npc.bio) {
            const bioWrap = document.createElement('div');
            bioWrap.style.cssText = `
                padding: 0 16px 12px;
                text-align: center;
            `;
            const bioText = document.createElement('div');
            bioText.style.cssText = `
                color: #64748b;
                font-size: 12px;
                font-style: italic;
                line-height: 1.5;
                background: #f8fafc;
                padding: 10px;
                border-radius: 8px;
                border: 1px dashed #cbd5e1;
                word-wrap: break-word;
            `;
            bioText.textContent = npc.bio;
            bioWrap.appendChild(bioText);
            this.contentWrap.appendChild(bioWrap);
        }

        // Divider
        const divider = document.createElement('div');
        divider.style.cssText = 'height: 1px; background: #e2e8f0; margin: 0 16px;';
        this.contentWrap.appendChild(divider);

        // Twitter / X section
        const twitterSection = document.createElement('div');
        twitterSection.style.cssText = `
            margin: 12px 16px 16px;
            padding: 10px 12px;
            background: #f0f9ff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: background 0.15s;
        `;
        twitterSection.addEventListener('mouseenter', () => { twitterSection.style.background = '#e0f2fe'; });
        twitterSection.addEventListener('mouseleave', () => { twitterSection.style.background = '#f0f9ff'; });

        const username = document.createElement('span');
        username.textContent = `@${npc.twitterUsername}`;
        username.style.cssText = `
            color: #1d9bf0; font-weight: 700; font-size: 13px;
            flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        `;
        twitterSection.appendChild(username);

        const xLogo = document.createElement('span');
        xLogo.textContent = '\ud835\udd4f';
        xLogo.style.cssText = 'font-size: 16px; color: #0f172a; flex-shrink: 0;';
        twitterSection.appendChild(xLogo);

        twitterSection.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(`https://x.com/${npc.twitterUsername}`, '_blank', 'noopener');
        });

        this.contentWrap.appendChild(twitterSection);

        // Quests section
        if (quests && quests.length > 0) {
            const questDivider = document.createElement('div');
            questDivider.style.cssText = 'height: 1px; background: #e2e8f0; margin: 0 16px;';
            this.contentWrap.appendChild(questDivider);

            const questHeader = document.createElement('div');
            questHeader.style.cssText = `
                padding: 8px 16px 4px;
                font-size: 10px;
                font-weight: 800;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 1px;
            `;
            questHeader.textContent = 'Quests';
            this.contentWrap.appendChild(questHeader);

            for (const q of quests) {
                const row = document.createElement('div');
                row.style.cssText = `
                    margin: 4px 16px;
                    padding: 8px 12px;
                    background: #faf5ff;
                    border: 1px solid #e9d5ff;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: background 0.15s;
                `;
                row.addEventListener('mouseenter', () => { row.style.background = '#f3e8ff'; });
                row.addEventListener('mouseleave', () => { row.style.background = '#faf5ff'; });

                const nameEl = document.createElement('span');
                nameEl.textContent = q.name;
                nameEl.style.cssText = 'font-size: 13px; font-weight: 600; color: #6b21a8;';
                row.appendChild(nameEl);

                const statusEl = document.createElement('span');
                if (q.completedToday) {
                    statusEl.textContent = 'Done';
                    statusEl.style.cssText = 'font-size: 10px; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 10px;';
                } else if (q.hasPendingSubmission) {
                    statusEl.textContent = 'Pending';
                    statusEl.style.cssText = 'font-size: 10px; font-weight: 700; color: #ca8a04; background: #fef9c3; padding: 2px 8px; border-radius: 10px;';
                } else {
                    statusEl.textContent = 'Available';
                    statusEl.style.cssText = 'font-size: 10px; font-weight: 700; color: #7c3aed; background: #ede9fe; padding: 2px 8px; border-radius: 10px;';
                }
                row.appendChild(statusEl);

                row.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.hide();
                    if (this.onQuestSelect) this.onQuestSelect(q);
                });

                this.contentWrap.appendChild(row);
            }

            // Bottom spacing
            const spacer = document.createElement('div');
            spacer.style.cssText = 'height: 12px;';
            this.contentWrap.appendChild(spacer);
        }
    }

    private positionCard(screenX: number, screenY: number): void {
        if (screenX === 0 && screenY === 0) {
            this.container.style.left = '50%';
            this.container.style.top = '50%';
            this.container.style.transform = 'translate(-50%, -50%)';
            return;
        }

        this.container.style.transform = 'none';

        const rect = this.container.getBoundingClientRect();
        const width = rect.width || 280;
        const height = rect.height || 200;

        let x = screenX;
        let y = screenY;

        if (x + width > window.innerWidth) x = window.innerWidth - width - 10;
        if (y + height > window.innerHeight) y = window.innerHeight - height - 10;

        this.container.style.left = `${Math.max(10, x)}px`;
        this.container.style.top = `${Math.max(10, y)}px`;
    }
}
