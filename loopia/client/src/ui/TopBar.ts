import { AuthService } from "../services/AuthService";
import { WalletService } from "../services/WalletService";
import { SettingsPanel } from "./SettingsPanel";

export class TopBar {
    private container: HTMLDivElement;
    private walletChip: HTMLDivElement | null = null;
    private balanceSpan: HTMLSpanElement | null = null;

    constructor() {
        this.container = document.createElement("div");
        this.createUI();

        // Listen for balance changes
        WalletService.getInstance().onBalanceChange((bal) => this.updateWalletChip(bal));
    }

    private createUI(): void {
        this.container.id = "top-bar";
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 56px;
            background: linear-gradient(180deg, #2a2a32 0%, #1e1e26 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            z-index: 2000;
            font-family: 'Outfit', sans-serif;
            box-sizing: border-box;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;

        // Left section: Brand text
        const left = document.createElement("div");
        left.style.cssText = `
            display: flex;
            align-items: center;
            margin-left: 24px;
        `;

        const brand = document.createElement("span");
        brand.textContent = "LOOPIA";
        brand.style.cssText = `
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.15em;
            background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #c084fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        `;
        left.appendChild(brand);

        this.container.appendChild(left);

        // Right section: Wallet chip + Action buttons
        const right = document.createElement("div");
        right.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            margin-right: 24px;
        `;

        // Wallet chip (shown if wallet exists)
        this.walletChip = this.createWalletChip();
        right.appendChild(this.walletChip);

        // Home button
        right.appendChild(this.createIconButton(
            this.createHomeSvg(),
            "Home",
            () => { window.location.href = "/"; }
        ));

        // Settings button
        right.appendChild(this.createIconButton(
            this.createSettingsSvg(),
            "Settings",
            () => { SettingsPanel.toggle(); }
        ));

        // Sign out button
        right.appendChild(this.createIconButton(
            this.createSignOutSvg(),
            "Sign Out",
            () => { AuthService.getInstance().logout(); }
        ));

        this.container.appendChild(right);
        document.body.appendChild(this.container);
    }

    private createIconButton(icon: SVGSVGElement, tooltip: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.title = tooltip;
        btn.appendChild(icon);
        btn.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(255, 255, 255, 0.04);
            color: #808090;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            transition: all 0.2s ease;
        `;

        btn.onmouseover = () => {
            btn.style.background = "rgba(99, 102, 241, 0.15)";
            btn.style.borderColor = "rgba(99, 102, 241, 0.3)";
            btn.style.color = "#a5b4fc";
        };
        btn.onmouseout = () => {
            btn.style.background = "rgba(255, 255, 255, 0.04)";
            btn.style.borderColor = "rgba(255, 255, 255, 0.06)";
            btn.style.color = "#808090";
        };

        btn.onclick = onClick;
        return btn;
    }

    // --- Wallet chip ---

    private createWalletChip(): HTMLDivElement {
        const chip = document.createElement("div");
        const ws = WalletService.getInstance();

        if (!ws.hasWallet()) {
            chip.style.display = "none";
            return chip;
        }

        const bal = parseFloat(ws.getBalance()).toFixed(4);
        const addr = ws.getAddress()!;

        chip.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 8px;
            padding: 4px 10px;
            margin-right: 6px;
            cursor: default;
        `;

        const addrSpan = document.createElement("span");
        addrSpan.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
        addrSpan.style.cssText = `
            font-size: 11px; font-family: monospace; color: #a5b4fc;
        `;

        const sep = document.createElement("span");
        sep.textContent = "|";
        sep.style.cssText = `color: rgba(255,255,255,0.15); font-size: 11px;`;

        this.balanceSpan = document.createElement("span");
        this.balanceSpan.textContent = `${bal} AVAX`;
        this.balanceSpan.style.cssText = `
            font-size: 11px; font-weight: 600; color: #e0e0e8;
        `;

        const refreshBtn = document.createElement("button");
        refreshBtn.textContent = "\u21BB";
        refreshBtn.title = "Refresh balance";
        refreshBtn.style.cssText = `
            background: none; border: none; color: #808090; font-size: 13px;
            cursor: pointer; padding: 0 2px; line-height: 1;
            transition: color 0.2s;
        `;
        refreshBtn.onmouseover = () => { refreshBtn.style.color = "#a5b4fc"; };
        refreshBtn.onmouseout = () => { refreshBtn.style.color = "#808090"; };
        refreshBtn.onclick = async () => {
            refreshBtn.style.animation = "spin 0.6s linear";
            await WalletService.getInstance().fetchWalletInfo();
            refreshBtn.style.animation = "";
        };

        chip.appendChild(addrSpan);
        chip.appendChild(sep);
        chip.appendChild(this.balanceSpan);
        chip.appendChild(refreshBtn);
        return chip;
    }

    private updateWalletChip(balance: string): void {
        const ws = WalletService.getInstance();

        if (!ws.hasWallet()) return;

        // If chip was hidden (wallet created after TopBar), rebuild it
        if (this.walletChip && this.walletChip.style.display === "none") {
            const parent = this.walletChip.parentElement;
            const next = this.walletChip.nextSibling;
            this.walletChip.remove();
            this.walletChip = this.createWalletChip();
            parent?.insertBefore(this.walletChip, next);
            return;
        }

        if (this.balanceSpan) {
            const bal = parseFloat(balance).toFixed(4);
            this.balanceSpan.textContent = `${bal} AVAX`;
        }
    }

    // --- SVG icon builders (safe DOM creation, no innerHTML) ---

    private svgEl(tag: string, attrs: Record<string, string>): SVGElement {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
    }

    private baseSvg(): SVGSVGElement {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        return svg;
    }

    private createHomeSvg(): SVGSVGElement {
        const svg = this.baseSvg();
        svg.appendChild(this.svgEl("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }));
        svg.appendChild(this.svgEl("polyline", { points: "9 22 9 12 15 12 15 22" }));
        return svg;
    }

    private createSettingsSvg(): SVGSVGElement {
        const svg = this.baseSvg();
        svg.appendChild(this.svgEl("circle", { cx: "12", cy: "12", r: "3" }));
        svg.appendChild(this.svgEl("path", {
            d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        }));
        return svg;
    }

    private createSignOutSvg(): SVGSVGElement {
        const svg = this.baseSvg();
        svg.appendChild(this.svgEl("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }));
        svg.appendChild(this.svgEl("polyline", { points: "16 17 21 12 16 7" }));
        svg.appendChild(this.svgEl("line", { x1: "21", y1: "12", x2: "9", y2: "12" }));
        return svg;
    }

    public destroy(): void {
        this.container.remove();
    }
}
