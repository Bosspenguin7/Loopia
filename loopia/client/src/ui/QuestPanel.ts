import { QuestService, QuestWithProgress } from "../services/QuestService";

const SCENE_LABELS: Record<string, string> = {
    Scene: "Main World",
    bearsandsalmon: "Bears & Salmon",
    CafeScene: "Cafe",
    ApartmentScene: "Apartment",
    GrottoScene: "Grotto",
};

export class QuestPanel {
    private static instance: QuestPanel | null = null;
    private overlay: HTMLDivElement;
    private panel: HTMLDivElement;
    private listContainer!: HTMLDivElement;
    private escHandler: (e: KeyboardEvent) => void;

    private constructor() {
        this.overlay = document.createElement("div");
        this.panel = document.createElement("div");
        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") this.close();
        };
        this.createUI();
        this.loadData();
    }

    public static toggle(): void {
        if (QuestPanel.instance) {
            QuestPanel.instance.close();
        } else {
            QuestPanel.instance = new QuestPanel();
        }
    }

    public static show(): void {
        if (!QuestPanel.instance) {
            QuestPanel.instance = new QuestPanel();
        }
    }

    public static hide(): void {
        if (QuestPanel.instance) {
            QuestPanel.instance.close();
        }
    }

    public static destroy(): void {
        if (QuestPanel.instance) {
            QuestPanel.instance.close();
        }
    }

    private showMessage(text: string) {
        this.listContainer.textContent = "";
        const msg = document.createElement("div");
        msg.style.cssText = "text-align:center;padding:32px 0;color:#94a3b8;font-size:13px;";
        msg.textContent = text;
        this.listContainer.appendChild(msg);
    }

    private async loadData() {
        this.showMessage("Loading quests...");

        const quests = await QuestService.getInstance().fetchAllQuestsWithProgress();

        if (quests.length === 0) {
            this.showMessage("No quests available.");
            return;
        }

        this.listContainer.textContent = "";
        quests.forEach((q) => this.listContainer.appendChild(this.createQuestRow(q)));
    }

    private createQuestRow(q: QuestWithProgress): HTMLDivElement {
        const row = document.createElement("div");
        row.style.cssText = `
            display: flex; align-items: center; gap: 12px;
            padding: 12px 14px; border-bottom: 1px solid #2d2d3d;
            transition: background 0.15s;
        `;
        row.addEventListener("mouseenter", () => { row.style.background = "#2a2a3a"; });
        row.addEventListener("mouseleave", () => { row.style.background = "transparent"; });

        // Status indicator
        const statusDot = document.createElement("div");
        let dotColor: string;
        let statusTip: string;
        if (q.progress.completedToday) {
            dotColor = "#22c55e";
            statusTip = "Completed today";
        } else if (q.progress.hasPendingSubmission) {
            dotColor = "#eab308";
            statusTip = "Pending review";
        } else {
            dotColor = "#3b82f6";
            statusTip = "Available";
        }
        statusDot.style.cssText = `
            width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
            background: ${dotColor};
            box-shadow: 0 0 6px ${dotColor}80;
        `;
        statusDot.title = statusTip;

        // Info column
        const info = document.createElement("div");
        info.style.cssText = "flex: 1; min-width: 0;";

        const nameRow = document.createElement("div");
        nameRow.style.cssText = "display:flex;align-items:center;gap:6px;";

        const name = document.createElement("span");
        name.textContent = q.name;
        name.style.cssText = "font-weight:600;font-size:14px;color:#e2e8f0;";

        const sceneBadge = document.createElement("span");
        sceneBadge.textContent = SCENE_LABELS[q.sceneKey] || q.sceneKey;
        sceneBadge.style.cssText = `
            font-size: 10px; color: #94a3b8; background: #334155;
            padding: 2px 6px; border-radius: 4px; white-space: nowrap;
        `;

        nameRow.appendChild(name);
        nameRow.appendChild(sceneBadge);

        const desc = document.createElement("div");
        desc.textContent = `NPC: ${q.npcName}`;
        desc.style.cssText = "font-size:12px;color:#64748b;margin-top:2px;";

        // Status text line
        const statusLine = document.createElement("div");
        statusLine.style.cssText = "font-size:11px;margin-top:3px;color:#94a3b8;";
        const parts: string[] = [];
        parts.push(statusTip);
        if (q.progress.currentStreak > 0) {
            parts.push(`Streak: ${q.progress.currentStreak}`);
        }
        if (q.progress.badgeEarned) {
            parts.push("Badge earned");
        }
        statusLine.textContent = parts.join(" \u00B7 ");

        info.appendChild(nameRow);
        info.appendChild(desc);
        info.appendChild(statusLine);

        // Rewards column
        const rewards = document.createElement("div");
        rewards.style.cssText = `
            display: flex; flex-direction: column; align-items: flex-end;
            gap: 2px; flex-shrink: 0;
        `;

        if (q.loopiReward > 0) {
            const loopi = document.createElement("span");
            loopi.textContent = `+${q.loopiReward} Loopi`;
            loopi.style.cssText = "font-size:12px;color:#a78bfa;font-weight:600;";
            rewards.appendChild(loopi);
        }
        if (q.xpReward > 0) {
            const xp = document.createElement("span");
            xp.textContent = `+${q.xpReward} XP`;
            xp.style.cssText = "font-size:11px;color:#38bdf8;";
            rewards.appendChild(xp);
        }

        row.appendChild(statusDot);
        row.appendChild(info);
        row.appendChild(rewards);

        return row;
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
            border: 2px solid #3d3d5c;
            border-radius: 12px;
            width: 420px;
            max-height: 520px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
            overflow: hidden;
        `;

        // Header
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 18px; border-bottom: 1px solid #2d2d3d;
            background: #24243a;
        `;

        const title = document.createElement("span");
        title.textContent = "Active Quests";
        title.style.cssText = "font-size:16px;font-weight:700;color:#e2e8f0;";

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "\u2715";
        closeBtn.style.cssText = `
            background: none; border: none; color: #94a3b8;
            font-size: 18px; cursor: pointer; padding: 0 4px;
            transition: color 0.15s;
        `;
        closeBtn.addEventListener("mouseenter", () => { closeBtn.style.color = "#e2e8f0"; });
        closeBtn.addEventListener("mouseleave", () => { closeBtn.style.color = "#94a3b8"; });
        closeBtn.onclick = () => this.close();

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Legend
        const legend = document.createElement("div");
        legend.style.cssText = `
            display: flex; gap: 14px; padding: 8px 18px;
            border-bottom: 1px solid #2d2d3d; font-size: 11px; color: #64748b;
        `;
        const legendItems: Array<[string, string]> = [
            ["#3b82f6", "Available"],
            ["#eab308", "Pending"],
            ["#22c55e", "Done"],
        ];
        legendItems.forEach(([color, label]) => {
            const item = document.createElement("div");
            item.style.cssText = "display:flex;align-items:center;gap:4px;";
            const dot = document.createElement("span");
            dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${color};`;
            const text = document.createElement("span");
            text.textContent = label;
            item.appendChild(dot);
            item.appendChild(text);
            legend.appendChild(item);
        });

        // Scrollable list
        this.listContainer = document.createElement("div");
        this.listContainer.style.cssText = "overflow-y:auto;flex:1;";

        this.panel.appendChild(header);
        this.panel.appendChild(legend);
        this.panel.appendChild(this.listContainer);
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
        document.addEventListener("keydown", this.escHandler);
    }

    private close(): void {
        document.removeEventListener("keydown", this.escHandler);
        this.overlay.remove();
        QuestPanel.instance = null;
    }
}
