import { WalletService } from "../services/WalletService";
import { SettingsPanel } from "./SettingsPanel";

const DISMISS_KEY = "loopia_wallet_banner_dismissed";

export class WalletBanner {
    private container: HTMLDivElement;
    private destroyed = false;

    constructor() {
        this.container = document.createElement("div");
        this.createUI();
    }

    private createUI(): void {
        this.container.id = "wallet-banner";
        this.container.style.cssText = `
            position: fixed;
            top: 42px;
            left: 0;
            width: 100%;
            height: 36px;
            background: linear-gradient(90deg, #312e81 0%, #4338ca 50%, #6366f1 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            z-index: 1999;
            font-family: 'Outfit', sans-serif;
            box-sizing: border-box;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        `;

        const text = document.createElement("span");
        text.textContent = "You haven't created your wallet yet";
        text.style.cssText = `
            color: #e0e7ff;
            font-size: 13px;
            font-weight: 500;
        `;

        const createBtn = document.createElement("button");
        createBtn.textContent = "Create Wallet";
        createBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 12px;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            transition: all 0.2s ease;
        `;
        createBtn.onmouseover = () => {
            createBtn.style.background = "rgba(255, 255, 255, 0.25)";
        };
        createBtn.onmouseout = () => {
            createBtn.style.background = "rgba(255, 255, 255, 0.15)";
        };
        // Open Settings panel instead of creating wallet directly
        createBtn.onclick = () => SettingsPanel.open();

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "\u00D7";
        closeBtn.style.cssText = `
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 20px;
            cursor: pointer;
            padding: 0 4px;
            line-height: 1;
            transition: color 0.2s ease;
        `;
        closeBtn.onmouseover = () => { closeBtn.style.color = "#fff"; };
        closeBtn.onmouseout = () => { closeBtn.style.color = "rgba(255, 255, 255, 0.6)"; };
        closeBtn.onclick = () => this.dismiss();

        this.container.appendChild(text);
        this.container.appendChild(createBtn);
        this.container.appendChild(closeBtn);
        document.body.appendChild(this.container);
    }

    private dismiss(): void {
        sessionStorage.setItem(DISMISS_KEY, "1");
        this.destroy();
    }

    public destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.container.remove();
    }

    public static shouldShow(): boolean {
        if (sessionStorage.getItem(DISMISS_KEY) === "1") return false;
        return !WalletService.getInstance().hasWallet();
    }
}
