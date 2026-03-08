import { Quest, QuestProgress, QuestService } from "../services/QuestService";
import { QUEST } from "@shared/constants";

export class QuestDialog {
    private overlay: HTMLDivElement | null = null;
    private escHandler: ((e: KeyboardEvent) => void) | null = null;

    public show(quest: Quest, progress: QuestProgress) {
        this.close();

        this.overlay = document.createElement("div");
        this.overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.55);
            z-index: 3000;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Outfit', sans-serif;
        `;
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };

        const panel = document.createElement("div");
        panel.style.cssText = `
            background: #1e1e26;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            width: 440px; max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
            color: #e0e0e8;
        `;

        // Header
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 20px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 12px 12px 0 0;
        `;
        const titleEl = document.createElement("div");
        const npcLabel = document.createElement("div");
        npcLabel.style.cssText = "font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px";
        npcLabel.textContent = quest.npcName;
        const questName = document.createElement("div");
        questName.style.cssText = "font-size:16px;font-weight:700;color:#fff";
        questName.textContent = quest.name;
        titleEl.appendChild(npcLabel);
        titleEl.appendChild(questName);

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "\u00D7";
        closeBtn.style.cssText = `background:none;border:none;color:rgba(255,255,255,0.8);font-size:22px;cursor:pointer;padding:0 4px;line-height:1;`;
        closeBtn.onclick = () => this.close();
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // NPC Speech
        const speechTexts: Record<string, string> = {
            grotto_explorer: "Step through the portal and play a game on Grotto Games. Then share it on X — paste the link here and I'll verify it.",
            fishing: "The rivers run deep with salmon. Bring me one, and I'll reward your patience.",
        };
        const speech = document.createElement("div");
        speech.style.cssText = `
            padding: 14px 20px;
            border-left: 3px solid #8b5cf6;
            margin: 16px 20px 0;
            background: rgba(139, 92, 246, 0.06);
            border-radius: 0 8px 8px 0;
            font-style: italic;
            font-size: 13px;
            color: #c4b5fd;
            line-height: 1.5;
        `;
        speech.textContent = `"${speechTexts[quest.questKey] || quest.description}"`;
        panel.appendChild(speech);

        // Description
        const desc = document.createElement("div");
        desc.style.cssText = `padding:12px 20px 0;font-size:13px;color:#a0a0b0;line-height:1.5;`;
        desc.textContent = quest.description;
        panel.appendChild(desc);

        // Rewards
        const rewards = document.createElement("div");
        rewards.style.cssText = `display:flex;gap:8px;padding:12px 20px 0;`;
        if (quest.loopiReward > 0) {
            const chip = document.createElement("span");
            chip.textContent = `+${quest.loopiReward} Loopi`;
            chip.style.cssText = `background:rgba(52,211,153,0.12);color:#34d399;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;`;
            rewards.appendChild(chip);
        }
        if (quest.xpReward > 0) {
            const chip = document.createElement("span");
            chip.textContent = `+${quest.xpReward} XP`;
            chip.style.cssText = `background:rgba(250,204,21,0.12);color:#facc15;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;`;
            rewards.appendChild(chip);
        }
        panel.appendChild(rewards);

        // Streak info
        if (progress.currentStreak > 0 || progress.badgeEarned) {
            const streakDiv = document.createElement("div");
            streakDiv.style.cssText = `padding:10px 20px 0;font-size:12px;color:#808090;`;
            let text = `Streak: ${progress.currentStreak} day${progress.currentStreak !== 1 ? 's' : ''}`;
            if (progress.badgeEarned) {
                text += ` | Badge earned!`;
            } else if (progress.currentStreak > 0) {
                const remaining = QUEST.GROTTO_STREAK_FOR_BADGE - progress.currentStreak;
                if (remaining > 0) text += ` (${remaining} more for badge)`;
            }
            streakDiv.textContent = text;
            panel.appendChild(streakDiv);
        }

        // Divider
        const divider = document.createElement("div");
        divider.style.cssText = `height:1px;background:rgba(255,255,255,0.06);margin:14px 20px 0;`;
        panel.appendChild(divider);

        // Action section
        const actions = document.createElement("div");
        actions.style.cssText = `padding:14px 20px 18px;`;

        if (progress.completedToday) {
            const msg = document.createElement("div");
            msg.style.cssText = `
                text-align:center;padding:12px;border-radius:8px;
                background:rgba(52,211,153,0.1);color:#34d399;
                font-size:13px;font-weight:600;
            `;
            msg.textContent = "Quest completed today! Come back tomorrow.";
            actions.appendChild(msg);
        } else if (quest.questType === "link_submission") {
            if (progress.hasPendingSubmission) {
                const msg = document.createElement("div");
                msg.style.cssText = `
                    text-align:center;padding:12px;border-radius:8px;
                    background:rgba(250,204,21,0.1);color:#facc15;
                    font-size:13px;font-weight:600;
                `;
                msg.textContent = "Your submission is pending admin review.";
                actions.appendChild(msg);
            } else {
                const input = document.createElement("input");
                input.type = "url";
                input.placeholder = "Paste your X (Twitter) post link...";
                input.maxLength = QUEST.MAX_LINK_LENGTH;
                input.style.cssText = `
                    width:100%;padding:10px 12px;border-radius:8px;
                    border:1px solid rgba(255,255,255,0.1);
                    background:rgba(255,255,255,0.04);color:#e0e0e8;
                    font-size:13px;font-family:'Outfit',sans-serif;
                    outline:none;margin-bottom:10px;box-sizing:border-box;
                `;
                input.onfocus = () => { input.style.borderColor = "#6366f1"; };
                input.onblur = () => { input.style.borderColor = "rgba(255,255,255,0.1)"; };

                const submitBtn = document.createElement("button");
                submitBtn.textContent = "Submit Link";
                submitBtn.style.cssText = `
                    width:100%;padding:10px;border-radius:8px;border:none;
                    background:#6366f1;color:#fff;font-size:13px;font-weight:600;
                    cursor:pointer;font-family:'Outfit',sans-serif;
                    transition:opacity 0.2s;
                `;
                submitBtn.onmouseover = () => { submitBtn.style.opacity = "0.85"; };
                submitBtn.onmouseout = () => { submitBtn.style.opacity = "1"; };

                submitBtn.onclick = async () => {
                    const url = input.value.trim();
                    if (!url) return;
                    submitBtn.textContent = "Submitting...";
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = "0.6";

                    const result = await QuestService.getInstance().submitLink(quest.id, url);
                    if (result.success) {
                        submitBtn.textContent = "Submitted!";
                        submitBtn.style.background = "#34d399";
                        input.disabled = true;
                        setTimeout(() => this.close(), 1500);
                    } else {
                        submitBtn.textContent = "Submit Link";
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = "1";
                        alert(result.error || "Failed to submit");
                    }
                };

                actions.appendChild(input);
                actions.appendChild(submitBtn);
            }
        } else if (quest.questType === "fishing_minigame") {
            const fishInfo = document.createElement("div");
            fishInfo.style.cssText = `text-align:center;font-size:13px;color:#808090;margin-bottom:10px;`;
            fishInfo.textContent = `Salmon in bag: ${progress.fishCount}`;
            actions.appendChild(fishInfo);

            // Hint to go to pool
            const hint = document.createElement("div");
            hint.style.cssText = `
                text-align:center;padding:10px;border-radius:8px;
                background:rgba(99,102,241,0.08);color:#a5b4fc;
                font-size:12px;margin-bottom:8px;
            `;
            hint.textContent = "Click the pool in the main world to catch fish!";
            actions.appendChild(hint);

            if (progress.fishCount > 0) {
                const turnInBtn = document.createElement("button");
                turnInBtn.textContent = "Turn In Fish";
                turnInBtn.style.cssText = `
                    width:100%;padding:10px;border-radius:8px;border:none;
                    background:#34d399;color:#fff;font-size:13px;font-weight:600;
                    cursor:pointer;font-family:'Outfit',sans-serif;
                    transition:opacity 0.2s;
                `;
                turnInBtn.onmouseover = () => { turnInBtn.style.opacity = "0.85"; };
                turnInBtn.onmouseout = () => { turnInBtn.style.opacity = "1"; };

                turnInBtn.onclick = async () => {
                    turnInBtn.textContent = "Completing...";
                    turnInBtn.disabled = true;
                    turnInBtn.style.opacity = "0.6";

                    const result = await QuestService.getInstance().completeFishingQuest(quest.id);
                    if (result.success) {
                        turnInBtn.textContent = "Quest Complete!";
                        turnInBtn.style.background = "#22c55e";
                        let rewardMsg = "";
                        if (result.loopiReward) rewardMsg += `+${result.loopiReward} Loopi `;
                        if (result.xpReward) rewardMsg += `+${result.xpReward} XP`;
                        if (result.badgeEarned) rewardMsg += " | Badge earned!";

                        if (rewardMsg) {
                            const rewardDiv = document.createElement("div");
                            rewardDiv.style.cssText = `text-align:center;margin-top:8px;font-size:12px;color:#34d399;font-weight:600;`;
                            rewardDiv.textContent = rewardMsg;
                            actions.appendChild(rewardDiv);
                        }
                        setTimeout(() => this.close(), 2000);
                    } else {
                        turnInBtn.textContent = "Turn In Fish";
                        turnInBtn.disabled = false;
                        turnInBtn.style.opacity = "1";
                        alert(result.error || "Failed to complete quest");
                    }
                };
                actions.appendChild(turnInBtn);
            }
        }

        panel.appendChild(actions);
        this.overlay.appendChild(panel);
        document.body.appendChild(this.overlay);

        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") this.close();
        };
        document.addEventListener("keydown", this.escHandler);
    }

    public close() {
        if (this.escHandler) {
            document.removeEventListener("keydown", this.escHandler);
            this.escHandler = null;
        }
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    public destroy() {
        this.close();
    }
}
