import { GuestAuth } from "../services/GuestAuth";
import { AuthService } from "../services/AuthService";
import { WalletService } from "../services/WalletService";
import { ShopService } from "../services/ShopService";
import { SocialService } from "../services/SocialService";

export class SettingsPanel {
    private static instance: SettingsPanel | null = null;
    private overlay: HTMLDivElement;
    private panel: HTMLDivElement;
    private walletSection!: HTMLDivElement;
    private escHandler: (e: KeyboardEvent) => void;

    private constructor() {
        this.overlay = document.createElement("div");
        this.panel = document.createElement("div");
        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") this.close();
        };
        this.createUI();
        this.refreshWallet();
    }

    private async refreshWallet(): Promise<void> {
        await WalletService.getInstance().fetchWalletInfo();
        const parent = this.walletSection.parentElement;
        if (parent) {
            const newSection = this.createWalletSection();
            parent.replaceChild(newSection, this.walletSection);
            this.walletSection = newSection;
        }
    }

    public static toggle(): void {
        if (SettingsPanel.instance) {
            SettingsPanel.instance.close();
        } else {
            SettingsPanel.instance = new SettingsPanel();
        }
    }

    public static open(): void {
        if (!SettingsPanel.instance) {
            SettingsPanel.instance = new SettingsPanel();
        }
    }

    private createUI(): void {
        // Overlay backdrop
        this.overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
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
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
            color: #e0e0e8;
        `;

        // Header
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        `;

        const title = document.createElement("span");
        title.textContent = "Settings";
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
        body.style.cssText = `padding: 16px 20px; display: flex; flex-direction: column; gap: 20px;`;

        // -- Display Name Section --
        body.appendChild(this.createDisplayNameSection());

        // -- Wallet Section --
        this.walletSection = this.createWalletSection();
        body.appendChild(this.walletSection);

        // -- Twitter Visibility Section (only for Twitter users) --
        if (AuthService.getInstance().getAuthMethod() === "twitter") {
            body.appendChild(this.createTwitterVisibilitySection());
        }

        // -- Sign Out --
        const signOutBtn = this.createButton("Sign Out", "#ef4444", () => {
            AuthService.getInstance().logout();
        });
        body.appendChild(signOutBtn);

        this.panel.appendChild(body);
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
        document.addEventListener("keydown", this.escHandler);
    }

    private createSectionLabel(text: string): HTMLDivElement {
        const label = document.createElement("div");
        label.textContent = text;
        label.style.cssText = `
            font-size: 11px; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.1em; color: #808090; margin-bottom: 8px;
        `;
        return label;
    }

    private createDisplayNameSection(): HTMLDivElement {
        const section = document.createElement("div");
        section.appendChild(this.createSectionLabel("Display Name"));

        const row = document.createElement("div");
        row.style.cssText = `display: flex; gap: 8px;`;

        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 20;
        input.value = GuestAuth.getInstance().getDisplayName() || "";
        input.placeholder = "Enter name...";
        input.style.cssText = `
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px 12px;
            color: #e0e0e8;
            font-size: 14px;
            font-family: 'Outfit', sans-serif;
            outline: none;
            transition: border-color 0.2s;
        `;
        input.onfocus = () => { input.style.borderColor = "rgba(99, 102, 241, 0.5)"; };
        input.onblur = () => { input.style.borderColor = "rgba(255, 255, 255, 0.1)"; };

        const saveBtn = this.createButton("Save", "#6366f1", () => {
            const name = input.value.trim();
            if (name) {
                GuestAuth.getInstance().updateName(name);
                saveBtn.textContent = "Saved!";
                setTimeout(() => { saveBtn.textContent = "Save"; }, 1500);
            }
        });
        saveBtn.style.padding = "8px 16px";
        saveBtn.style.fontSize = "13px";

        row.appendChild(input);
        row.appendChild(saveBtn);
        section.appendChild(row);
        return section;
    }

    private createWalletSection(): HTMLDivElement {
        const section = document.createElement("div");
        section.appendChild(this.createSectionLabel("Wallet"));

        const walletService = WalletService.getInstance();

        if (walletService.hasWallet()) {
            this.renderWalletInfo(section, walletService);
        } else {
            this.renderWalletCreate(section);
        }

        return section;
    }

    private createTwitterVisibilitySection(): HTMLDivElement {
        const section = document.createElement("div");
        section.appendChild(this.createSectionLabel("Twitter Profile"));

        const row = document.createElement("div");
        row.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px; padding: 10px 12px;
        `;

        const label = document.createElement("span");
        label.textContent = "Show on profile card";
        label.style.cssText = `font-size: 13px; color: #e0e0e8;`;

        // Toggle switch
        const toggle = document.createElement("div");
        toggle.style.cssText = `
            width: 40px; height: 22px; border-radius: 11px;
            background: rgba(255, 255, 255, 0.15);
            cursor: pointer; position: relative;
            transition: background 0.2s;
        `;

        const knob = document.createElement("div");
        knob.style.cssText = `
            width: 18px; height: 18px; border-radius: 50%;
            background: #fff; position: absolute; top: 2px; left: 2px;
            transition: transform 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        `;
        toggle.appendChild(knob);

        let isOn = false;

        const setVisual = (on: boolean) => {
            isOn = on;
            toggle.style.background = on ? "#6366f1" : "rgba(255, 255, 255, 0.15)";
            knob.style.transform = on ? "translateX(18px)" : "translateX(0)";
        };

        // Fetch current state
        const guestId = GuestAuth.getInstance().getGuestId();
        if (guestId) {
            SocialService.getInstance().getProfile(guestId).then((p) => {
                setVisual(!!p.twitterVisible);
            }).catch(() => {});
        }

        toggle.onclick = async () => {
            const newVal = !isOn;
            setVisual(newVal); // optimistic
            try {
                await SocialService.getInstance().updateTwitterVisibility(newVal);
            } catch {
                setVisual(!newVal); // revert
            }
        };

        row.appendChild(label);
        row.appendChild(toggle);
        section.appendChild(row);
        return section;
    }

    private renderWalletInfo(section: HTMLDivElement, walletService: WalletService): void {
        const address = walletService.getAddress()!;
        const balance = walletService.getBalance();

        // Address row
        const addrRow = document.createElement("div");
        addrRow.style.cssText = `
            display: flex; align-items: center; gap: 8px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px; padding: 10px 12px;
            margin-bottom: 8px;
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
        section.appendChild(addrRow);

        // Balance
        const balRow = document.createElement("div");
        balRow.style.cssText = `
            display: flex; align-items: center; gap: 8px;
            padding: 0 4px;
        `;

        const balLabel = document.createElement("span");
        balLabel.textContent = "AVAX Balance:";
        balLabel.style.cssText = `font-size: 13px; color: #808090;`;

        const balValue = document.createElement("span");
        const parsed = parseFloat(balance);
        balValue.textContent = `${parsed.toFixed(4)} AVAX`;
        balValue.style.cssText = `font-size: 13px; font-weight: 600; color: #e0e0e8;`;

        balRow.appendChild(balLabel);
        balRow.appendChild(balValue);
        section.appendChild(balRow);

        // Withdraw form (hidden by default)
        const withdrawForm = document.createElement("div");
        withdrawForm.style.cssText = `
            margin-top: 10px; display: none; flex-direction: column; gap: 10px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px; padding: 14px;
        `;

        const withdrawBtn = this.createButton("Withdraw AVAX", "#f59e0b", () => {
            const isVisible = withdrawForm.style.display === "flex";
            withdrawForm.style.display = isVisible ? "none" : "flex";
            withdrawBtn.textContent = isVisible ? "Withdraw AVAX" : "Cancel";
            withdrawBtn.style.background = isVisible ? "#f59e0b" : "#808090";
        });
        withdrawBtn.style.marginTop = "10px";
        section.appendChild(withdrawBtn);

        // -- Withdraw form contents --
        const inputStyle = `
            width: 100%; box-sizing: border-box;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px; padding: 10px 12px;
            color: #e0e0e8; font-size: 13px;
            font-family: 'Outfit', sans-serif;
            outline: none; transition: border-color 0.2s;
        `;

        // Address input
        const addrInputLabel = document.createElement("div");
        addrInputLabel.textContent = "Destination Address";
        addrInputLabel.style.cssText = `font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #808090;`;

        const addrInput = document.createElement("input");
        addrInput.type = "text";
        addrInput.placeholder = "0x...";
        addrInput.style.cssText = inputStyle;
        addrInput.onfocus = () => { addrInput.style.borderColor = "rgba(99, 102, 241, 0.5)"; };
        addrInput.onblur = () => { addrInput.style.borderColor = "rgba(255, 255, 255, 0.1)"; };

        // Amount input
        const amtInputLabel = document.createElement("div");
        amtInputLabel.textContent = "Amount (AVAX)";
        amtInputLabel.style.cssText = `font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #808090;`;

        const amtRow = document.createElement("div");
        amtRow.style.cssText = `display: flex; gap: 8px; align-items: center;`;

        const amtInput = document.createElement("input");
        amtInput.type = "text";
        amtInput.placeholder = "0.0";
        amtInput.style.cssText = inputStyle + `flex: 1;`;
        amtInput.onfocus = () => { amtInput.style.borderColor = "rgba(99, 102, 241, 0.5)"; };
        amtInput.onblur = () => { amtInput.style.borderColor = "rgba(255, 255, 255, 0.1)"; };

        const EST_FEE = walletService.getEstimatedFee() || 0.000525;

        const maxBtn = document.createElement("button");
        maxBtn.textContent = "MAX";
        maxBtn.style.cssText = `
            background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 6px; color: #f59e0b; font-size: 11px; font-weight: 700;
            padding: 4px 10px; cursor: pointer; font-family: 'Outfit', sans-serif;
            transition: all 0.2s; flex-shrink: 0;
        `;
        maxBtn.onclick = () => {
            const bal = parseFloat(walletService.getBalance());
            const max = Math.max(0, bal - EST_FEE);
            amtInput.value = max > 0 ? max.toFixed(4) : "0";
            updateTotal();
        };

        amtRow.appendChild(amtInput);
        amtRow.appendChild(maxBtn);

        const feeRow = document.createElement("div");
        feeRow.style.cssText = `
            display: flex; flex-direction: column; gap: 4px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 6px; padding: 8px 10px;
        `;

        const feeLineStyle = `display: flex; justify-content: space-between; font-size: 11px;`;

        const feeLine = document.createElement("div");
        feeLine.style.cssText = feeLineStyle;
        const feeLabel = document.createElement("span");
        feeLabel.textContent = "Est. Network Fee";
        feeLabel.style.color = "#808090";
        const feeValue = document.createElement("span");
        feeValue.textContent = `~${EST_FEE.toFixed(6)} AVAX`;
        feeValue.style.cssText = `color: #808090; font-family: monospace;`;
        feeLine.appendChild(feeLabel);
        feeLine.appendChild(feeValue);

        const totalLine = document.createElement("div");
        totalLine.style.cssText = feeLineStyle + ` margin-top: 2px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06);`;
        const totalLabel = document.createElement("span");
        totalLabel.textContent = "Total";
        totalLabel.style.cssText = `color: #e0e0e8; font-weight: 600;`;
        const totalValue = document.createElement("span");
        totalValue.textContent = "—";
        totalValue.style.cssText = `color: #e0e0e8; font-weight: 600; font-family: monospace;`;
        totalLine.appendChild(totalLabel);
        totalLine.appendChild(totalValue);

        feeRow.appendChild(feeLine);
        feeRow.appendChild(totalLine);

        // Update total when amount changes
        const updateTotal = () => {
            const amt = parseFloat(amtInput.value);
            if (!isNaN(amt) && amt > 0) {
                totalValue.textContent = `${(amt + EST_FEE).toFixed(6)} AVAX`;
            } else {
                totalValue.textContent = "—";
            }
        };
        amtInput.addEventListener("input", updateTotal);

        // Status message
        const statusMsg = document.createElement("div");
        statusMsg.style.cssText = `
            font-size: 12px; line-height: 1.4; padding: 8px 10px;
            border-radius: 6px; display: none;
        `;

        const showStatus = (msg: string, type: "error" | "success" | "info") => {
            statusMsg.textContent = msg;
            statusMsg.style.display = "block";
            if (type === "error") {
                statusMsg.style.background = "rgba(239, 68, 68, 0.1)";
                statusMsg.style.border = "1px solid rgba(239, 68, 68, 0.25)";
                statusMsg.style.color = "#f87171";
            } else if (type === "success") {
                statusMsg.style.background = "rgba(52, 211, 153, 0.1)";
                statusMsg.style.border = "1px solid rgba(52, 211, 153, 0.25)";
                statusMsg.style.color = "#34d399";
            } else {
                statusMsg.style.background = "rgba(99, 102, 241, 0.1)";
                statusMsg.style.border = "1px solid rgba(99, 102, 241, 0.25)";
                statusMsg.style.color = "#a5b4fc";
            }
        };

        // Confirm + Send area
        const confirmArea = document.createElement("div");
        confirmArea.style.cssText = `display: flex; flex-direction: column; gap: 8px;`;

        const sendBtn = this.createButton("Review & Send", "#f59e0b", () => {});
        sendBtn.style.fontSize = "13px";
        sendBtn.style.padding = "10px";

        let awaitingConfirm = false;

        sendBtn.onclick = async () => {
            const toAddr = addrInput.value.trim();
            const amt = amtInput.value.trim();

            if (!toAddr || !toAddr.startsWith("0x") || toAddr.length !== 42) {
                showStatus("Enter a valid wallet address (0x... 42 characters)", "error");
                return;
            }

            const amtNum = parseFloat(amt);
            if (!amt || isNaN(amtNum) || amtNum <= 0) {
                showStatus("Enter a valid amount greater than 0", "error");
                return;
            }

            if (amtNum > parsed) {
                showStatus("Insufficient balance", "error");
                return;
            }

            // Two-step confirmation
            if (!awaitingConfirm) {
                awaitingConfirm = true;
                showStatus(
                    `Send ${amtNum.toFixed(4)} AVAX + ~${EST_FEE.toFixed(6)} fee to ${toAddr.slice(0, 6)}...${toAddr.slice(-4)} on Fuji Testnet?`,
                    "info"
                );
                sendBtn.textContent = "Confirm Send";
                sendBtn.style.background = "#ef4444";
                return;
            }

            // Execute withdraw
            sendBtn.textContent = "Sending...";
            sendBtn.disabled = true;
            sendBtn.style.opacity = "0.6";
            statusMsg.style.display = "none";

            try {
                const result = await ShopService.getInstance().withdraw(toAddr, amt);
                await WalletService.getInstance().fetchWalletInfo();

                // Replace confirm area with success view
                while (confirmArea.firstChild) {
                    confirmArea.removeChild(confirmArea.firstChild);
                }

                const successBox = document.createElement("div");
                successBox.style.cssText = `
                    background: rgba(52, 211, 153, 0.08);
                    border: 1px solid rgba(52, 211, 153, 0.2);
                    border-radius: 8px; padding: 12px; text-align: center;
                `;

                const successText = document.createElement("div");
                successText.textContent = `Sent ${amtNum.toFixed(4)} AVAX`;
                successText.style.cssText = `font-size: 14px; font-weight: 700; color: #34d399; margin-bottom: 6px;`;

                const txHashEl = document.createElement("div");
                txHashEl.textContent = `Tx: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-6)}`;
                txHashEl.style.cssText = `font-size: 11px; color: #808090; font-family: monospace; margin-bottom: 10px;`;

                const viewBtn = document.createElement("button");
                viewBtn.textContent = "View on Snowtrace";
                viewBtn.style.cssText = `
                    background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3);
                    border-radius: 6px; color: #34d399; font-size: 12px; font-weight: 600;
                    padding: 6px 16px; cursor: pointer; font-family: 'Outfit', sans-serif;
                    transition: opacity 0.2s;
                `;
                viewBtn.onmouseover = () => { viewBtn.style.opacity = "0.85"; };
                viewBtn.onmouseout = () => { viewBtn.style.opacity = "1"; };
                viewBtn.onclick = () => window.open(result.snowtraceUrl, "_blank");

                successBox.appendChild(successText);
                successBox.appendChild(txHashEl);
                successBox.appendChild(viewBtn);
                confirmArea.appendChild(successBox);

                // Update balance display
                const newBal = parseFloat(walletService.getBalance());
                balValue.textContent = `${newBal.toFixed(4)} AVAX`;
            } catch (e: any) {
                showStatus(e.message || "Withdraw failed", "error");
                sendBtn.textContent = "Review & Send";
                sendBtn.style.background = "#f59e0b";
                sendBtn.disabled = false;
                sendBtn.style.opacity = "1";
                awaitingConfirm = false;
            }
        };

        // Reset confirm when inputs change
        const resetConfirm = () => {
            if (awaitingConfirm) {
                awaitingConfirm = false;
                sendBtn.textContent = "Review & Send";
                sendBtn.style.background = "#f59e0b";
                statusMsg.style.display = "none";
            }
        };
        addrInput.addEventListener("input", resetConfirm);
        amtInput.addEventListener("input", resetConfirm);

        confirmArea.appendChild(sendBtn);

        withdrawForm.appendChild(addrInputLabel);
        withdrawForm.appendChild(addrInput);
        withdrawForm.appendChild(amtInputLabel);
        withdrawForm.appendChild(amtRow);
        withdrawForm.appendChild(feeRow);
        withdrawForm.appendChild(statusMsg);
        withdrawForm.appendChild(confirmArea);
        section.appendChild(withdrawForm);
    }

    private renderWalletCreate(section: HTMLDivElement): void {
        const desc = document.createElement("p");
        desc.textContent = "Create an Avalanche C-Chain wallet to use on-chain features.";
        desc.style.cssText = `
            font-size: 13px; color: #808090; margin: 0 0 10px 0; line-height: 1.4;
        `;
        section.appendChild(desc);

        const createBtn = this.createButton("Create Wallet", "#6366f1", async () => {
            createBtn.textContent = "Creating...";
            (createBtn as HTMLButtonElement).disabled = true;
            createBtn.style.opacity = "0.6";

            const success = await WalletService.getInstance().createWallet();

            if (success) {
                // Rebuild wallet section
                const parent = this.walletSection.parentElement;
                const newSection = this.createWalletSection();
                parent?.replaceChild(newSection, this.walletSection);
                this.walletSection = newSection;
            } else {
                createBtn.textContent = "Create Wallet";
                (createBtn as HTMLButtonElement).disabled = false;
                createBtn.style.opacity = "1";
            }
        });
        section.appendChild(createBtn);
    }

    private createButton(text: string, color: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.style.cssText = `
            background: ${color};
            border: none;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            padding: 10px 20px;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            transition: all 0.2s;
            width: 100%;
        `;
        btn.onmouseover = () => { btn.style.opacity = "0.85"; };
        btn.onmouseout = () => { btn.style.opacity = "1"; };
        btn.onclick = onClick;
        return btn;
    }

    private close(): void {
        document.removeEventListener("keydown", this.escHandler);
        this.overlay.remove();
        SettingsPanel.instance = null;
    }
}
