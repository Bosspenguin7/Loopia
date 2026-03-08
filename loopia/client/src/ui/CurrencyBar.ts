import { EconomyService } from '../services/EconomyService';
import { WalletService } from '../services/WalletService';
import { AvaxDepositPanel } from './AvaxDepositPanel';

const ASSET_BASE = 'assets/ui';

export class CurrencyBar {
    private container: HTMLDivElement;
    private loopiEl: HTMLSpanElement;
    private avaxEl: HTMLSpanElement;
    private resizeObserver?: ResizeObserver;
    private resizeHandler: () => void;

    constructor(scene: Phaser.Scene) {
        // Create HTML overlay for the currency bar
        this.container = document.createElement('div');
        this.container.id = 'currency-bar';
        this.container.style.cssText = `
            position: absolute;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 2000;
            pointer-events: none;
            font-family: 'Inter', -apple-system, sans-serif;
        `;

        // Coin (Loopi) bar
        const loopiGroup = this.createCurrencyGroup(
            `${ASSET_BASE}/icon_diamond_1.png`,
            `${ASSET_BASE}/ui_bar_bg.png`,
            `${ASSET_BASE}/btn_add.png`
        );
        this.loopiEl = loopiGroup.valueEl;
        this.container.appendChild(loopiGroup.group);

        // Diamond (AVAX) bar
        const avaxGroup = this.createCurrencyGroup(
            `${ASSET_BASE}/avax.png`,
            `${ASSET_BASE}/ui_bar_bg.png`,
            `${ASSET_BASE}/btn_add.png`
        );
        this.avaxEl = avaxGroup.valueEl;
        avaxGroup.addBtn.addEventListener('click', () => {
            AvaxDepositPanel.open();
        });
        this.container.appendChild(avaxGroup.group);

        document.body.appendChild(this.container);

        // Position relative to canvas
        this.resizeHandler = () => this.reposition(scene);
        this.reposition(scene);

        // Re-position on window resize
        window.addEventListener('resize', this.resizeHandler);

        // Also observe the canvas parent for layout changes
        const canvas = scene.game.canvas;
        if (canvas.parentElement) {
            this.resizeObserver = new ResizeObserver(() => this.reposition(scene));
            this.resizeObserver.observe(canvas.parentElement);
        }

        // Listen for Loopi balance changes
        const economy = EconomyService.getInstance();
        economy.setOnBalanceChange((balance) => {
            this.updateLoopi(balance.loopi);
        });

        // Initial render from cache
        const cached = economy.getCachedBalance();
        this.updateLoopi(cached.loopi);

        // Listen for AVAX balance changes
        const wallet = WalletService.getInstance();
        wallet.onBalanceChange((balance) => {
            this.updateAvax(balance);
        });

        // Initial AVAX render
        if (wallet.hasWallet()) {
            this.updateAvax(wallet.getBalance());
        } else {
            this.avaxEl.textContent = '—';
        }

        // Fetch wallet info to get latest AVAX balance
        wallet.fetchWalletInfo().then(() => {
            if (wallet.hasWallet()) {
                this.updateAvax(wallet.getBalance());
            } else {
                this.avaxEl.textContent = '—';
            }
        }).catch(() => {});
    }

    private reposition(scene: Phaser.Scene): void {
        const canvas = scene.game.canvas;
        const rect = canvas.getBoundingClientRect();
        this.container.style.top = `${rect.top + 12}px`;
        this.container.style.left = `${rect.right - this.container.offsetWidth - 12}px`;
    }

    private createCurrencyGroup(
        iconSrc: string,
        barBgSrc: string,
        addBtnSrc: string
    ): { group: HTMLDivElement; valueEl: HTMLSpanElement; addBtn: HTMLImageElement } {
        const group = document.createElement('div');
        group.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0;
            height: 36px;
        `;

        // Currency icon (diamond or coin) — overlaps bar slightly
        const icon = document.createElement('img');
        icon.src = iconSrc;
        icon.style.cssText = `
            width: 36px;
            height: 36px;
            position: relative;
            z-index: 2;
            flex-shrink: 0;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        `;

        // Bar background with value text
        const barWrap = document.createElement('div');
        barWrap.style.cssText = `
            position: relative;
            height: 28px;
            min-width: 60px;
            margin-left: -10px;
            z-index: 1;
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
        `;

        const barBg = document.createElement('img');
        barBg.src = barBgSrc;
        barBg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: fill;
        `;

        const valueEl = document.createElement('span');
        valueEl.textContent = '0';
        valueEl.style.cssText = `
            position: relative;
            z-index: 1;
            padding: 0 24px 0 16px;
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.02em;
            text-shadow: 0 1px 3px rgba(0,0,0,0.5);
            white-space: nowrap;
        `;

        barWrap.appendChild(barBg);
        barWrap.appendChild(valueEl);

        // Add (+) button
        const addBtn = document.createElement('img');
        addBtn.src = addBtnSrc;
        addBtn.style.cssText = `
            width: 28px;
            height: 28px;
            margin-left: -20px;
            cursor: pointer;
            pointer-events: auto;
            z-index: 2;
            flex-shrink: 0;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            transition: transform 0.15s ease;
        `;
        addBtn.addEventListener('mouseenter', () => {
            addBtn.style.transform = 'scale(1.1)';
        });
        addBtn.addEventListener('mouseleave', () => {
            addBtn.style.transform = 'scale(1)';
        });

        group.appendChild(icon);
        group.appendChild(barWrap);
        group.appendChild(addBtn);

        return { group, valueEl, addBtn };
    }

    private updateLoopi(loopi: number): void {
        this.loopiEl.textContent = loopi.toLocaleString();
    }

    private updateAvax(balance: string): void {
        // Show up to 4 decimal places for AVAX
        const num = parseFloat(balance);
        if (isNaN(num) || num === 0) {
            this.avaxEl.textContent = '0';
        } else {
            this.avaxEl.textContent = num.toLocaleString(undefined, { maximumFractionDigits: 4 });
        }
    }

    public destroy(): void {
        EconomyService.getInstance().setOnBalanceChange(() => {});
        WalletService.getInstance().onBalanceChange(() => {});
        window.removeEventListener('resize', this.resizeHandler);
        this.resizeObserver?.disconnect();
        this.container.remove();
    }
}
