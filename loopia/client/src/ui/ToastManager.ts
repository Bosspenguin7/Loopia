type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastConfig {
    borderColor: string;
    iconBg: string;
    iconColor: string;
    icon: string;
}

const TOAST_CONFIGS: Record<ToastType, ToastConfig> = {
    info:    { borderColor: '#4f46e5', iconBg: '#e0e7ff', iconColor: '#4f46e5', icon: 'ℹ' },
    success: { borderColor: '#16a34a', iconBg: '#dcfce7', iconColor: '#16a34a', icon: '✓' },
    warning: { borderColor: '#d97706', iconBg: '#fef3c7', iconColor: '#d97706', icon: '⚠' },
    error:   { borderColor: '#ef4444', iconBg: '#fee2e2', iconColor: '#ef4444', icon: '✖' },
};

const TOAST_DURATION = 4000;
const TOAST_GAP = 12;
const ANIM_DURATION = 300;

export class ToastManager {
    private static instance: ToastManager;
    private container: HTMLDivElement;
    private styleEl: HTMLStyleElement;
    private toasts: HTMLDivElement[] = [];

    private constructor() {
        // Inject keyframes
        this.styleEl = document.createElement('style');
        this.styleEl.textContent = `
            @keyframes toastSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to   { transform: translateX(0); opacity: 1; }
            }
            @keyframes toastSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to   { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(this.styleEl);

        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 4000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: ${TOAST_GAP}px;
        `;
        document.body.appendChild(this.container);
    }

    public static getInstance(): ToastManager {
        if (!ToastManager.instance) {
            ToastManager.instance = new ToastManager();
        }
        return ToastManager.instance;
    }

    public show(message: string, type: ToastType = 'info'): void {
        const config = TOAST_CONFIGS[type];
        const toast = document.createElement('div');
        toast.style.cssText = `
            pointer-events: auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            font-family: 'Outfit', Arial, sans-serif;
            width: 280px;
            padding: 12px 16px;
            border-left: 4px solid ${config.borderColor};
            display: flex;
            align-items: center;
            gap: 10px;
            animation: toastSlideIn ${ANIM_DURATION}ms ease-out forwards;
        `;

        // Icon circle
        const iconEl = document.createElement('div');
        iconEl.style.cssText = `
            width: 24px;
            height: 24px;
            min-width: 24px;
            border-radius: 50%;
            background: ${config.iconBg};
            color: ${config.iconColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        `;
        iconEl.textContent = config.icon;

        // Message
        const msgEl = document.createElement('div');
        msgEl.style.cssText = `
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            flex: 1;
            word-wrap: break-word;
        `;
        msgEl.textContent = message;

        // Close button (Sanalika red circle style)
        const closeBtn = document.createElement('div');
        closeBtn.style.cssText = `
            width: 20px;
            height: 20px;
            min-width: 20px;
            border-radius: 50%;
            background: #ef4444;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2);
            transition: transform 0.1s;
        `;
        closeBtn.textContent = '✖';
        closeBtn.addEventListener('pointerdown', () => {
            closeBtn.style.transform = 'translateY(2px)';
        });
        closeBtn.addEventListener('pointerup', () => {
            closeBtn.style.transform = 'translateY(0)';
            this.removeToast(toast);
        });
        closeBtn.addEventListener('pointerleave', () => {
            closeBtn.style.transform = 'translateY(0)';
        });

        toast.appendChild(iconEl);
        toast.appendChild(msgEl);
        toast.appendChild(closeBtn);

        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Auto-dismiss after duration
        setTimeout(() => this.removeToast(toast), TOAST_DURATION);
    }

    public showWithActions(message: string, type: ToastType = 'info', actions: { label: string; action: () => void }[]): void {
        const config = TOAST_CONFIGS[type];
        const toast = document.createElement('div');
        toast.style.cssText = `
            pointer-events: auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            font-family: 'Outfit', Arial, sans-serif;
            width: 280px;
            padding: 12px 16px;
            border-left: 4px solid ${config.borderColor};
            display: flex;
            flex-direction: column;
            gap: 10px;
            animation: toastSlideIn ${ANIM_DURATION}ms ease-out forwards;
        `;

        // Top row: icon + message
        const topRow = document.createElement('div');
        topRow.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const iconEl = document.createElement('div');
        iconEl.style.cssText = `
            width: 24px; height: 24px; min-width: 24px; border-radius: 50%;
            background: ${config.iconBg}; color: ${config.iconColor};
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: bold;
        `;
        iconEl.textContent = config.icon;

        const msgEl = document.createElement('div');
        msgEl.style.cssText = 'font-size: 13px; font-weight: 600; color: #0f172a; flex: 1; word-wrap: break-word;';
        msgEl.textContent = message;

        topRow.appendChild(iconEl);
        topRow.appendChild(msgEl);
        toast.appendChild(topRow);

        // Action buttons row
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 8px;';

        for (const { label, action } of actions) {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.cssText = `
                flex: 1; padding: 6px 12px; border: none; border-radius: 6px;
                font-family: 'Outfit', Arial, sans-serif; font-size: 12px; font-weight: 700;
                cursor: pointer; transition: all 0.15s;
                background: ${config.iconBg}; color: ${config.iconColor};
            `;
            btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(0.95)');
            btn.addEventListener('mouseleave', () => btn.style.filter = 'brightness(1)');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                action();
                this.removeToast(toast);
            });
            btnRow.appendChild(btn);
        }

        toast.appendChild(btnRow);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Auto-dismiss after 15s for action toasts (longer than normal)
        setTimeout(() => this.removeToast(toast), 15000);
    }

    private removeToast(toast: HTMLDivElement): void {
        const idx = this.toasts.indexOf(toast);
        if (idx === -1) return;

        this.toasts.splice(idx, 1);
        toast.style.animation = `toastSlideOut ${ANIM_DURATION}ms ease-in forwards`;
        setTimeout(() => toast.remove(), ANIM_DURATION);
    }

    public destroy(): void {
        this.container.remove();
        this.styleEl.remove();
        this.toasts = [];
        // Reset singleton so it can be re-created on scene restart
        if (ToastManager.instance === this) {
            (ToastManager as any).instance = undefined;
        }
    }
}
