import { WalletService } from "../services/WalletService";
import { SHOP } from "../../../shared/constants";

export class AvaxDepositPanel {
    private static instance: AvaxDepositPanel | null = null;
    private overlay: HTMLDivElement;
    private panel: HTMLDivElement;
    private escHandler: (e: KeyboardEvent) => void;

    private constructor() {
        this.overlay = document.createElement("div");
        this.panel = document.createElement("div");
        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") this.close();
        };
        this.createUI();
    }

    public static toggle(): void {
        if (AvaxDepositPanel.instance) {
            AvaxDepositPanel.instance.close();
        } else {
            AvaxDepositPanel.instance = new AvaxDepositPanel();
        }
    }

    public static open(): void {
        if (!AvaxDepositPanel.instance) {
            AvaxDepositPanel.instance = new AvaxDepositPanel();
        }
    }

    public static close(): void {
        if (AvaxDepositPanel.instance) {
            AvaxDepositPanel.instance.close();
        }
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
            width: 380px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
            color: #e0e0e8;
        `;

        // Header
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        `;

        const title = document.createElement("span");
        title.textContent = "Deposit AVAX";
        title.style.cssText = `font-size: 16px; font-weight: 700; color: #a5b4fc;`;

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "\u00D7";
        closeBtn.style.cssText = `
            background: none; border: none; color: #808090; font-size: 22px;
            cursor: pointer; padding: 0 4px; line-height: 1;
        `;
        closeBtn.onclick = () => this.close();

        header.appendChild(title);
        header.appendChild(closeBtn);
        this.panel.appendChild(header);

        // Body
        const body = document.createElement("div");
        body.style.cssText = `padding: 20px; display: flex; flex-direction: column; gap: 16px;`;

        const walletService = WalletService.getInstance();

        if (walletService.hasWallet()) {
            this.renderWalletContent(body, walletService);
        } else {
            this.renderCreateWallet(body);
        }

        this.panel.appendChild(body);
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
        document.addEventListener("keydown", this.escHandler);
    }

    private renderWalletContent(body: HTMLDivElement, walletService: WalletService): void {
        const address = walletService.getAddress()!;
        const balance = walletService.getBalance();

        // Balance display
        const balanceRow = document.createElement("div");
        balanceRow.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px; padding: 14px 16px;
        `;

        const balLabel = document.createElement("span");
        balLabel.textContent = "Balance";
        balLabel.style.cssText = `font-size: 13px; color: #808090;`;

        const balValue = document.createElement("span");
        const parsed = parseFloat(balance);
        balValue.textContent = `${isNaN(parsed) ? "0.0000" : parsed.toFixed(4)} AVAX`;
        balValue.style.cssText = `font-size: 15px; font-weight: 700; color: #34d399;`;

        balanceRow.appendChild(balLabel);
        balanceRow.appendChild(balValue);
        body.appendChild(balanceRow);

        // Wallet address with copy
        const addrSection = document.createElement("div");

        const addrLabel = document.createElement("div");
        addrLabel.textContent = "Your Wallet Address";
        addrLabel.style.cssText = `
            font-size: 11px; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.1em; color: #808090; margin-bottom: 8px;
        `;
        addrSection.appendChild(addrLabel);

        const addrRow = document.createElement("div");
        addrRow.style.cssText = `
            display: flex; align-items: center; gap: 8px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px; padding: 10px 12px;
        `;

        const addrText = document.createElement("span");
        addrText.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        addrText.style.cssText = `
            flex: 1; font-size: 14px; font-family: monospace; color: #c4b5fd;
        `;

        const copyBtn = document.createElement("button");
        copyBtn.textContent = "Copy";
        copyBtn.style.cssText = `
            background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 6px; color: #a5b4fc; font-size: 11px; font-weight: 600;
            padding: 4px 10px; cursor: pointer; font-family: 'Outfit', sans-serif;
            transition: all 0.2s;
        `;
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(address).then(() => {
                copyBtn.textContent = "Copied!";
                setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
            });
        };

        addrRow.appendChild(addrText);
        addrRow.appendChild(copyBtn);
        addrSection.appendChild(addrRow);
        body.appendChild(addrSection);

        // QR Code
        const qrContainer = document.createElement("div");
        qrContainer.style.cssText = `
            display: flex; flex-direction: column; align-items: center; gap: 8px;
        `;

        const qrImg = document.createElement("img");
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(address)}&bgcolor=1e1e26&color=c4b5fd`;
        qrImg.alt = "Wallet QR Code";
        qrImg.width = 150;
        qrImg.height = 150;
        qrImg.style.cssText = `
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.08);
        `;

        const qrHint = document.createElement("div");
        qrHint.textContent = "Scan to get wallet address";
        qrHint.style.cssText = `font-size: 11px; color: #606070;`;

        qrContainer.appendChild(qrImg);
        qrContainer.appendChild(qrHint);
        body.appendChild(qrContainer);

        // Info note
        const infoNote = document.createElement("div");
        infoNote.style.cssText = `
            background: rgba(99, 102, 241, 0.08);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 8px; padding: 12px 14px;
            font-size: 12px; color: #a5b4fc; line-height: 1.5;
        `;
        infoNote.textContent = "Send AVAX on the Avalanche Fuji C-Chain (Testnet) to the address above. Funds will appear in your balance automatically.";
        body.appendChild(infoNote);

        // Action buttons
        const btnRow = document.createElement("div");
        btnRow.style.cssText = `display: flex; gap: 8px;`;

        // Faucet button
        const faucetBtn = document.createElement("button");
        faucetBtn.textContent = "Get Test AVAX";
        faucetBtn.style.cssText = `
            flex: 1; background: #6366f1; border: none; border-radius: 8px;
            color: #fff; font-size: 13px; font-weight: 600;
            padding: 10px 12px; cursor: pointer;
            font-family: 'Outfit', sans-serif; transition: opacity 0.2s;
        `;
        faucetBtn.onmouseover = () => { faucetBtn.style.opacity = "0.85"; };
        faucetBtn.onmouseout = () => { faucetBtn.style.opacity = "1"; };
        faucetBtn.onclick = () => {
            window.open("https://faucet.avax.network/", "_blank");
        };

        // Snowtrace button
        const snowtraceBtn = document.createElement("button");
        snowtraceBtn.textContent = "View on Explorer";
        snowtraceBtn.style.cssText = `
            flex: 1; background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px;
            color: #c0c0d0; font-size: 13px; font-weight: 600;
            padding: 10px 12px; cursor: pointer;
            font-family: 'Outfit', sans-serif; transition: opacity 0.2s;
        `;
        snowtraceBtn.onmouseover = () => { snowtraceBtn.style.opacity = "0.85"; };
        snowtraceBtn.onmouseout = () => { snowtraceBtn.style.opacity = "1"; };
        snowtraceBtn.onclick = () => {
            window.open(`${SHOP.SNOWTRACE_ADDR_URL}${address}`, "_blank");
        };

        btnRow.appendChild(faucetBtn);
        btnRow.appendChild(snowtraceBtn);
        body.appendChild(btnRow);
    }

    private renderCreateWallet(body: HTMLDivElement): void {
        const desc = document.createElement("p");
        desc.textContent = "You need a wallet to deposit AVAX. Create one to get started.";
        desc.style.cssText = `
            font-size: 13px; color: #808090; margin: 0; line-height: 1.5;
            text-align: center; padding: 10px 0;
        `;
        body.appendChild(desc);

        const createBtn = document.createElement("button");
        createBtn.textContent = "Create Wallet";
        createBtn.style.cssText = `
            background: #6366f1; border: none; border-radius: 8px;
            color: #fff; font-size: 14px; font-weight: 600;
            padding: 12px 20px; cursor: pointer; width: 100%;
            font-family: 'Outfit', sans-serif; transition: opacity 0.2s;
        `;
        createBtn.onmouseover = () => { createBtn.style.opacity = "0.85"; };
        createBtn.onmouseout = () => { createBtn.style.opacity = "1"; };
        createBtn.onclick = async () => {
            createBtn.textContent = "Creating...";
            createBtn.disabled = true;
            createBtn.style.opacity = "0.6";

            const success = await WalletService.getInstance().createWallet();

            if (success) {
                // Re-open panel with wallet content
                this.close();
                AvaxDepositPanel.instance = new AvaxDepositPanel();
            } else {
                createBtn.textContent = "Create Wallet";
                createBtn.disabled = false;
                createBtn.style.opacity = "1";
            }
        };
        body.appendChild(createBtn);
    }

    private close(): void {
        document.removeEventListener("keydown", this.escHandler);
        this.overlay.remove();
        AvaxDepositPanel.instance = null;
    }
}
