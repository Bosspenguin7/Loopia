import { Network } from '../services/Network';
import { TRADE } from '@shared/constants';

export class TradeWindow {
    private container: HTMLDivElement;
    private header: HTMLDivElement;
    private myOfferSection!: HTMLDivElement;
    private partnerOfferSection!: HTMLDivElement;
    private footerSection!: HTMLDivElement;

    private loopiInput!: HTMLInputElement;
    private readyBtn!: HTMLButtonElement;
    private confirmBtn!: HTMLButtonElement;
    private cancelBtn!: HTMLButtonElement;
    private countdownLabel!: HTMLDivElement;

    private partnerLoopiLabel!: HTMLSpanElement;
    private myReadyIndicator!: HTMLSpanElement;
    private partnerReadyIndicator!: HTMLSpanElement;

    private mySessionId: string = '';
    private isMyReady = false;
    private isPartnerReady = false;

    // Drag state
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private initialLeft = 0;
    private initialTop = 0;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'trade-window';
        this.container.style.cssText = `
            position: fixed;
            display: none;
            width: 420px;
            background: #ffffff;
            border-radius: 12px;
            font-family: 'Outfit', Arial, sans-serif;
            z-index: 4000;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);
            user-select: none;
            flex-direction: column;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        `;

        // Header
        this.header = document.createElement('div');
        this.header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border-bottom: 2px solid #f59e0b;
            cursor: grab;
        `;
        this.container.appendChild(this.header);

        // Body
        const body = document.createElement('div');
        body.style.cssText = 'display: flex; border-bottom: 1px solid #e2e8f0;';

        this.myOfferSection = document.createElement('div');
        this.myOfferSection.style.cssText = 'flex: 1; padding: 16px; border-right: 1px solid #e2e8f0;';

        this.partnerOfferSection = document.createElement('div');
        this.partnerOfferSection.style.cssText = 'flex: 1; padding: 16px;';

        body.appendChild(this.myOfferSection);
        body.appendChild(this.partnerOfferSection);
        this.container.appendChild(body);

        // Footer
        this.footerSection = document.createElement('div');
        this.footerSection.style.cssText = `
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            background: #f8fafc;
            border-radius: 0 0 12px 12px;
        `;
        this.container.appendChild(this.footerSection);

        document.body.appendChild(this.container);

        this.setupDragging();

        // Block game input
        this.container.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    public show(partnerName: string, _partnerSessionId: string, mySessionId: string): void {
        this.mySessionId = mySessionId;
        this.isMyReady = false;
        this.isPartnerReady = false;

        // Build header
        while (this.header.firstChild) this.header.removeChild(this.header.firstChild);
        const title = document.createElement('div');
        title.style.cssText = 'font-weight: 800; font-size: 15px; color: #92400e; display: flex; align-items: center; gap: 8px;';
        title.textContent = `Trade — ${partnerName}`;
        this.header.appendChild(title);

        const closeBtn = this.createCloseButton();
        this.header.appendChild(closeBtn);

        // Build my offer section
        while (this.myOfferSection.firstChild) this.myOfferSection.removeChild(this.myOfferSection.firstChild);
        const myTitle = document.createElement('div');
        myTitle.style.cssText = 'font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;';
        const myTitleText = document.createElement('span');
        myTitleText.textContent = 'Your Offer';
        myTitle.appendChild(myTitleText);
        this.myReadyIndicator = document.createElement('span');
        this.myReadyIndicator.style.cssText = 'font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600;';
        this.updateReadyBadge(this.myReadyIndicator, false);
        myTitle.appendChild(this.myReadyIndicator);
        this.myOfferSection.appendChild(myTitle);

        this.loopiInput = this.createCurrencyInput('Loopi');
        this.myOfferSection.appendChild(this.createInputRow('Loopi', this.loopiInput));

        // Send offer on input change (debounced)
        let debounce: ReturnType<typeof setTimeout>;
        const sendOffer = () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                const loopi = this.parseInput(this.loopiInput);
                Network.getInstance().sendTradeSetOffer(loopi);
            }, 300);
        };
        this.loopiInput.addEventListener('input', sendOffer);

        // Build partner offer section
        while (this.partnerOfferSection.firstChild) this.partnerOfferSection.removeChild(this.partnerOfferSection.firstChild);
        const partnerTitle = document.createElement('div');
        partnerTitle.style.cssText = 'font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;';
        const partnerTitleText = document.createElement('span');
        partnerTitleText.textContent = `${partnerName}'s Offer`;
        partnerTitle.appendChild(partnerTitleText);
        this.partnerReadyIndicator = document.createElement('span');
        this.partnerReadyIndicator.style.cssText = 'font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600;';
        this.updateReadyBadge(this.partnerReadyIndicator, false);
        partnerTitle.appendChild(this.partnerReadyIndicator);
        this.partnerOfferSection.appendChild(partnerTitle);

        this.partnerLoopiLabel = document.createElement('span');
        this.partnerLoopiLabel.textContent = '0';
        this.partnerOfferSection.appendChild(this.createDisplayRow('Loopi', this.partnerLoopiLabel));

        // Build footer
        while (this.footerSection.firstChild) this.footerSection.removeChild(this.footerSection.firstChild);
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 10px; width: 100%;';

        this.cancelBtn = this.createActionButton('Cancel', '#fee2e2', '#ef4444', () => {
            Network.getInstance().sendTradeCancel();
            this.hide();
        });

        this.readyBtn = this.createActionButton('Ready', '#dcfce7', '#16a34a', () => {
            if (this.isMyReady) {
                Network.getInstance().sendTradeUnready();
            } else {
                Network.getInstance().sendTradeReady();
            }
        });

        this.confirmBtn = this.createActionButton('Confirm', '#dbeafe', '#2563eb', () => {
            Network.getInstance().sendTradeConfirm();
            this.confirmBtn.disabled = true;
            this.confirmBtn.style.opacity = '0.5';
            this.confirmBtn.textContent = 'Confirmed';
        });
        this.confirmBtn.style.display = 'none';

        btnRow.appendChild(this.cancelBtn);
        btnRow.appendChild(this.readyBtn);
        btnRow.appendChild(this.confirmBtn);
        this.footerSection.appendChild(btnRow);

        this.countdownLabel = document.createElement('div');
        this.countdownLabel.style.cssText = 'font-size: 14px; font-weight: 800; color: #d97706; text-align: center; display: none;';
        this.footerSection.appendChild(this.countdownLabel);

        // Reset position and show
        this.container.style.left = '50%';
        this.container.style.top = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.display = 'flex';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }

    /** Centered modal: "PlayerName wants to trade! [Accept] [Decline]" */
    public showIncomingRequest(fromName: string, onAccept: () => void, onDecline: () => void): void {
        this.clearAllSections();

        // Header
        while (this.header.firstChild) this.header.removeChild(this.header.firstChild);
        const title = document.createElement('div');
        title.style.cssText = 'font-weight: 800; font-size: 15px; color: #92400e;';
        title.textContent = 'Trade Request';
        this.header.appendChild(title);

        // Body content
        const body = this.container.children[1] as HTMLElement;
        body.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 24px 20px; gap: 16px;';

        const msg = document.createElement('div');
        msg.style.cssText = 'font-size: 15px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.5;';
        msg.textContent = `${fromName} wants to trade with you!`;
        body.appendChild(msg);

        // Buttons
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 12px; width: 100%;';

        const declineBtn = this.createActionButton('Decline', '#fee2e2', '#ef4444', () => {
            onDecline();
            this.hide();
        });
        const acceptBtn = this.createActionButton('Accept', '#dcfce7', '#16a34a', () => {
            onAccept();
            this.hide();
        });

        btnRow.appendChild(declineBtn);
        btnRow.appendChild(acceptBtn);
        body.appendChild(btnRow);

        // Hide footer
        this.footerSection.style.display = 'none';

        this.container.style.width = '340px';
        this.container.style.left = '50%';
        this.container.style.top = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.display = 'flex';
    }

    /** Centered modal: "Waiting for PlayerName... [Cancel]" */
    public showPendingRequest(targetName: string, onCancel: () => void): void {
        this.clearAllSections();

        // Header
        while (this.header.firstChild) this.header.removeChild(this.header.firstChild);
        const title = document.createElement('div');
        title.style.cssText = 'font-weight: 800; font-size: 15px; color: #92400e;';
        title.textContent = 'Trade Request Sent';
        this.header.appendChild(title);

        // Body content
        const body = this.container.children[1] as HTMLElement;
        body.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 24px 20px; gap: 16px;';

        const msg = document.createElement('div');
        msg.style.cssText = 'font-size: 15px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.5;';
        msg.textContent = `Waiting for ${targetName} to respond...`;
        body.appendChild(msg);

        // Spinner-like dots
        const dots = document.createElement('div');
        dots.style.cssText = 'font-size: 24px; color: #d97706; letter-spacing: 4px; font-weight: bold;';
        dots.textContent = '...';
        body.appendChild(dots);

        // Cancel button
        const cancelBtn = this.createActionButton('Cancel', '#fee2e2', '#ef4444', () => {
            onCancel();
            this.hide();
        });
        cancelBtn.style.width = '120px';
        cancelBtn.style.flex = 'none';
        body.appendChild(cancelBtn);

        // Hide footer
        this.footerSection.style.display = 'none';

        this.container.style.width = '340px';
        this.container.style.left = '50%';
        this.container.style.top = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.display = 'flex';
    }

    /** Dismiss only the request modals (incoming/pending) — not the full trade window */
    public hideRequestModal(): void {
        // Only hide if we're showing a request modal (no inputs rendered)
        if (!this.loopiInput || this.loopiInput.parentElement === null) {
            this.hide();
        }
    }

    public isVisible(): boolean {
        return this.container.style.display !== 'none';
    }

    private clearAllSections(): void {
        while (this.myOfferSection.firstChild) this.myOfferSection.removeChild(this.myOfferSection.firstChild);
        while (this.partnerOfferSection.firstChild) this.partnerOfferSection.removeChild(this.partnerOfferSection.firstChild);
        while (this.footerSection.firstChild) this.footerSection.removeChild(this.footerSection.firstChild);
        this.footerSection.style.display = '';

        // Reset body to side-by-side layout for future trade window show()
        const body = this.container.children[1] as HTMLElement;
        body.style.cssText = 'display: flex; border-bottom: 1px solid #e2e8f0;';
        // Re-append sections (they may have been detached)
        while (body.firstChild) body.removeChild(body.firstChild);
        this.myOfferSection.style.cssText = 'flex: 1; padding: 16px; border-right: 1px solid #e2e8f0;';
        this.partnerOfferSection.style.cssText = 'flex: 1; padding: 16px;';
        body.appendChild(this.myOfferSection);
        body.appendChild(this.partnerOfferSection);

        this.container.style.width = '420px';
    }

    public updatePartnerOffer(loopi: number): void {
        if (this.partnerLoopiLabel) this.partnerLoopiLabel.textContent = String(loopi);
    }

    public updateReadyState(sessionId: string, isReady: boolean): void {
        if (sessionId === this.mySessionId) {
            this.isMyReady = isReady;
            this.updateReadyBadge(this.myReadyIndicator, isReady);
            this.readyBtn.textContent = isReady ? 'Unready' : 'Ready';
            this.readyBtn.style.background = isReady ? '#fef3c7' : '#dcfce7';
            this.readyBtn.style.color = isReady ? '#d97706' : '#16a34a';

            // Disable inputs when ready
            if (this.loopiInput) this.loopiInput.disabled = isReady;
        } else {
            this.isPartnerReady = isReady;
            this.updateReadyBadge(this.partnerReadyIndicator, isReady);
        }

        // Show/hide confirm based on both ready
        if (this.isMyReady && this.isPartnerReady) {
            this.confirmBtn.style.display = 'block';
            this.confirmBtn.disabled = false;
            this.confirmBtn.style.opacity = '1';
            this.confirmBtn.textContent = 'Confirm';
        } else {
            this.confirmBtn.style.display = 'none';
            this.countdownLabel.style.display = 'none';
            }
    }

    public showCountdown(remaining: number): void {
        this.countdownLabel.style.display = 'block';
        this.countdownLabel.textContent = `Trade in ${remaining}...`;
    }

    public destroy(): void {
        this.container.remove();
    }

    // ──────────── Private Helpers ────────────

    private parseInput(input: HTMLInputElement): number {
        const val = parseInt(input.value, 10);
        if (isNaN(val) || val < 0) return 0;
        if (val > TRADE.MAX_OFFER) return TRADE.MAX_OFFER;
        return val;
    }

    private createCurrencyInput(placeholder: string): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = String(TRADE.MAX_OFFER);
        input.value = '0';
        input.placeholder = placeholder;
        input.style.cssText = `
            width: 100%;
            box-sizing: border-box;
            padding: 8px 10px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            background: #f8fafc;
            outline: none;
            transition: border-color 0.15s;
        `;
        input.addEventListener('focus', () => input.style.borderColor = '#f59e0b');
        input.addEventListener('blur', () => input.style.borderColor = '#e2e8f0');
        return input;
    }

    private createInputRow(label: string, input: HTMLInputElement): HTMLDivElement {
        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom: 10px;';
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 4px;';
        lbl.textContent = label;
        row.appendChild(lbl);
        row.appendChild(input);
        return row;
    }

    private createDisplayRow(label: string, valueEl: HTMLSpanElement): HTMLDivElement {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px;';
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-size: 13px; color: #64748b; font-weight: 600;';
        lbl.textContent = label;
        valueEl.style.cssText = 'font-size: 15px; color: #0f172a; font-weight: 800;';
        row.appendChild(lbl);
        row.appendChild(valueEl);
        return row;
    }

    private createActionButton(text: string, bg: string, color: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s;
            background: ${bg};
            color: ${color};
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        `;
        btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(0.95)');
        btn.addEventListener('mouseleave', () => btn.style.filter = 'brightness(1)');
        btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.96)');
        btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
        btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
        return btn;
    }

    private createCloseButton(): HTMLDivElement {
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '\u2716';
        closeBtn.style.cssText = `
            width: 24px; height: 24px; border-radius: 50%;
            background: #ef4444; color: white;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: bold; cursor: pointer;
            box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2);
            transition: transform 0.1s;
        `;
        closeBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); closeBtn.style.transform = 'translateY(2px)'; });
        closeBtn.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            closeBtn.style.transform = 'translateY(0)';
            Network.getInstance().sendTradeCancel();
            this.hide();
        });
        closeBtn.addEventListener('pointerleave', () => closeBtn.style.transform = 'translateY(0)');
        return closeBtn;
    }

    private updateReadyBadge(el: HTMLSpanElement, ready: boolean): void {
        if (!el) return;
        if (ready) {
            el.textContent = 'Ready';
            el.style.background = '#dcfce7';
            el.style.color = '#16a34a';
        } else {
            el.textContent = 'Not Ready';
            el.style.background = '#f1f5f9';
            el.style.color = '#94a3b8';
        }
    }

    private setupDragging(): void {
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
            this.container.style.left = `${this.initialLeft + (e.clientX - this.dragStartX)}px`;
            this.container.style.top = `${this.initialTop + (e.clientY - this.dragStartY)}px`;
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
}
