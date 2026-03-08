import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { CafeScene } from './scenes/CafeScene';
import { BearsAndSalmonScene } from './scenes/BearsAndSalmonScene';
import { ApartmentScene } from './scenes/ApartmentScene';
import { AvalabsScene } from './scenes/AvalabsScene';
import { GrottoScene } from './scenes/GrottoScene';
import { LobbyOverlay } from './ui/LobbyOverlay';
import { LoadingScreen } from './ui/LoadingScreen';
import { LoginScreen } from './ui/LoginScreen';
import { TopBar } from './ui/TopBar';
import { GuestAuth } from './services/GuestAuth';
import { AuthService } from './services/AuthService';
import { WalletService } from './services/WalletService';
import { WalletBanner } from './ui/WalletBanner';
import './style.css';

// Global error handlers
window.onerror = (_msg, _source, _lineno, _colno, error) => {
    console.error('[Uncaught Error]', error);
};
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
};

// Global join info — read by GameScene on create()
export let pendingJoinInfo: { playerName: string; roomName: string } | null = null;
export function clearPendingJoinInfo() {
    pendingJoinInfo = null;
}

export let game: Phaser.Game | null = null;

function showLobby() {
    const guestAuth = GuestAuth.getInstance();
    const defaultName = guestAuth.getDisplayName() || undefined;

    // Show top bar
    new TopBar();

    // Check wallet status and show banner if needed
    const walletService = WalletService.getInstance();
    walletService.fetchWalletInfo().then(() => {
        if (WalletBanner.shouldShow()) {
            const banner = new WalletBanner();
            walletService.onWalletCreated(() => banner.destroy());
        }
    });

    new LobbyOverlay((playerName, roomName) => {
        pendingJoinInfo = { playerName, roomName };

        if (playerName !== defaultName) {
            guestAuth.updateName(playerName);
        }

        LoadingScreen.getInstance().show();

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 1200,
            height: 750,
            parent: 'app',
            backgroundColor: '#0f0e1d',
            audio: {
                disableWebAudio: false
            },
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                max: { width: 1200, height: 750 }
            },
            scene: [GameScene, CafeScene, BearsAndSalmonScene, ApartmentScene, AvalabsScene, GrottoScene]
        };

        game = new Phaser.Game(config);
    }, defaultName);
}

async function boot() {
    const authService = AuthService.getInstance();

    // 1. Check for Twitter OAuth callback (?code=X&state=Y)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
        // Clean URL immediately — reset to root
        history.replaceState({}, "", "/");

        const success = await authService.handleTwitterCallback(code, state);
        if (success) {
            showLobby();
            return;
        }
        // If callback failed, fall through to login screen
    }

    // 2. Clear legacy guest tokens (no auth_method means old guest session)
    if (localStorage.getItem("loopia_guest_token") && !localStorage.getItem("loopia_auth_method")) {
        localStorage.removeItem("loopia_guest_token");
    }

    // 3. Check for existing authenticated session
    if (authService.isAuthenticated()) {
        const guestAuth = GuestAuth.getInstance();
        await guestAuth.authenticate();

        if (guestAuth.getToken()) {
            showLobby();
            return;
        }
    }

    // 4. No valid auth — show login screen
    new LoginScreen(() => {
        showLobby();
    });
}

boot();
