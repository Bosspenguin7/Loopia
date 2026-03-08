import { QuestService } from "../services/QuestService";
import { QUEST } from "@shared/constants";

export class FishingMinigame {
    private overlay: HTMLDivElement | null = null;
    private animInterval: ReturnType<typeof setInterval> | null = null;
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private escHandler: ((e: KeyboardEvent) => void) | null = null;
    private onComplete?: (caught: boolean, fishCount?: number) => void;

    public start(onComplete?: (caught: boolean, fishCount?: number) => void) {
        this.close();
        this.onComplete = onComplete;

        this.overlay = document.createElement("div");
        this.overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 4000;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-family: 'Outfit', sans-serif;
        `;

        // Title
        const title = document.createElement("div");
        title.textContent = "Catch the Fish!";
        title.style.cssText = `font-size:20px;font-weight:700;color:#fff;margin-bottom:8px;`;
        this.overlay.appendChild(title);

        const hint = document.createElement("div");
        hint.textContent = "Click when the line is in the green zone!";
        hint.style.cssText = `font-size:13px;color:#a0a0b0;margin-bottom:20px;`;
        this.overlay.appendChild(hint);

        // Bar container
        const barWidth = 400;
        const barHeight = 40;
        const zoneStart = 0.4;
        const zoneWidth = 0.2;

        const barContainer = document.createElement("div");
        barContainer.style.cssText = `
            position: relative; width: ${barWidth}px; height: ${barHeight}px;
            background: #2d2d3a; border-radius: 8px; overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
        `;

        // Green zone
        const greenZone = document.createElement("div");
        greenZone.style.cssText = `
            position: absolute;
            left: ${zoneStart * 100}%;
            width: ${zoneWidth * 100}%;
            height: 100%;
            background: rgba(52, 211, 153, 0.3);
            border-left: 2px solid #34d399;
            border-right: 2px solid #34d399;
        `;
        barContainer.appendChild(greenZone);

        // Moving line (yellow)
        const line = document.createElement("div");
        line.style.cssText = `
            position: absolute;
            left: 0;
            width: 3px;
            height: 100%;
            background: #facc15;
            border-radius: 2px;
            transition: none;
        `;
        barContainer.appendChild(line);

        this.overlay.appendChild(barContainer);

        // Result text area
        const resultDiv = document.createElement("div");
        resultDiv.style.cssText = `margin-top:16px;font-size:15px;font-weight:600;height:24px;`;
        this.overlay.appendChild(resultDiv);

        // Animation
        let position = 0;
        let direction = 1;
        const speed = 2; // pixels per frame
        let active = true;

        this.animInterval = setInterval(() => {
            if (!active) return;
            position += speed * direction;
            if (position >= barWidth - 3) {
                position = barWidth - 3;
                direction = -1;
            } else if (position <= 0) {
                position = 0;
                direction = 1;
            }
            line.style.left = `${position}px`;
        }, 20);

        // Click handler
        const handleClick = async () => {
            if (!active) return;
            active = false;
            this.stopAnimation();

            const normalized = position / barWidth;
            const inZone = normalized >= zoneStart && normalized <= (zoneStart + zoneWidth);

            if (inZone) {
                line.style.background = "#34d399";
                resultDiv.textContent = "Catching...";
                resultDiv.style.color = "#34d399";

                const result = await QuestService.getInstance().catchFish();
                if (result.success) {
                    resultDiv.textContent = "Fish caught! Return to the NPC to complete.";
                    resultDiv.style.fontSize = "13px"; // Slightly smaller to fit
                    setTimeout(() => {
                        this.close();
                        if (this.onComplete) this.onComplete(true, result.fishCount);
                    }, 1200);
                } else {
                    resultDiv.textContent = result.error || "Failed to catch!";
                    resultDiv.style.color = "#f87171";
                    setTimeout(() => this.close(), 1500);
                    if (this.onComplete) this.onComplete(false);
                }
            } else {
                line.style.background = "#f87171";
                resultDiv.textContent = "Missed! Try again.";
                resultDiv.style.color = "#f87171";
                setTimeout(() => {
                    this.close();
                    if (this.onComplete) this.onComplete(false);
                }, 1500);
            }
        };

        barContainer.onclick = handleClick;
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) {
                // Click on overlay background = cancel
                this.close();
                if (this.onComplete) this.onComplete(false);
            }
        };

        // Timeout auto-fail
        this.timeoutId = setTimeout(() => {
            if (active) {
                active = false;
                this.stopAnimation();
                line.style.background = "#f87171";
                resultDiv.textContent = "Too slow! Time's up.";
                resultDiv.style.color = "#f87171";
                setTimeout(() => {
                    this.close();
                    if (this.onComplete) this.onComplete(false);
                }, 1500);
            }
        }, QUEST.FISHING_DURATION_MS);

        // ESC to cancel
        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                active = false;
                this.close();
                if (this.onComplete) this.onComplete(false);
            }
        };
        document.addEventListener("keydown", this.escHandler);

        document.body.appendChild(this.overlay);
    }

    private stopAnimation() {
        if (this.animInterval) {
            clearInterval(this.animInterval);
            this.animInterval = null;
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    public close() {
        this.stopAnimation();
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
