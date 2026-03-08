import { AuthService } from "../services/AuthService";
import { GuestAuth } from "../services/GuestAuth";

export class LoginScreen {
    private container: HTMLDivElement;
    private onAuthenticated: () => void;

    constructor(onAuthenticated: () => void) {
        this.onAuthenticated = onAuthenticated;
        this.container = document.createElement("div");
        this.createUI();
    }

    private isDevMode(): boolean {
        return !window.location.hostname.includes("loopia.world");
    }

    private createUI(): void {
        this.container.id = "login-screen";
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(15, 15, 20, 0.95), rgba(0, 0, 0, 0.98));
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1001;
            font-family: 'Outfit', sans-serif;
            color: white;
            backdrop-filter: blur(10px);
        `;

        // Background glow
        const glow = document.createElement("div");
        glow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60vw;
            height: 60vh;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(10, 10, 15, 0) 70%);
            border-radius: 50%;
            filter: blur(80px);
            z-index: -1;
            pointer-events: none;
        `;
        this.container.appendChild(glow);

        // Float animation
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            @keyframes loginFloat {
                0% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(2deg); }
                100% { transform: translateY(0px) rotate(0deg); }
            }
        `;
        this.container.appendChild(styleSheet);

        // Logo
        const logo = document.createElement("img");
        logo.src = "assets/common/logo.png";
        logo.alt = "LOOPIA Logo";
        logo.style.cssText = `
            width: 180px;
            height: auto;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.6));
            animation: loginFloat 6s ease-in-out infinite;
        `;
        this.container.appendChild(logo);

        // Subtitle
        const subtitle = document.createElement("p");
        subtitle.innerText = "Building the Future of Connection";
        subtitle.style.cssText = `
            font-size: 16px;
            color: #a0a0b0;
            margin-bottom: 48px;
            font-weight: 300;
            letter-spacing: 0.05em;
        `;
        this.container.appendChild(subtitle);

        // Buttons container
        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            width: 320px;
        `;

        // Twitter/X login button
        const twitterBtn = document.createElement("button");
        twitterBtn.style.cssText = `
            width: 100%;
            padding: 16px 24px;
            font-size: 16px;
            font-weight: 600;
            font-family: 'Outfit', sans-serif;
            background: #000;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.3s ease;
        `;

        // X logo SVG
        const xIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        xIcon.setAttribute("width", "20");
        xIcon.setAttribute("height", "20");
        xIcon.setAttribute("viewBox", "0 0 24 24");
        xIcon.setAttribute("fill", "white");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z");
        xIcon.appendChild(path);

        const btnText = document.createElement("span");
        btnText.textContent = "Continue with X";

        twitterBtn.appendChild(xIcon);
        twitterBtn.appendChild(btnText);

        twitterBtn.onmouseover = () => {
            twitterBtn.style.background = "#1a1a1a";
            twitterBtn.style.borderColor = "rgba(255, 255, 255, 0.4)";
            twitterBtn.style.transform = "translateY(-2px)";
            twitterBtn.style.boxShadow = "0 8px 20px -4px rgba(0, 0, 0, 0.5)";
        };
        twitterBtn.onmouseout = () => {
            twitterBtn.style.background = "#000";
            twitterBtn.style.borderColor = "rgba(255, 255, 255, 0.2)";
            twitterBtn.style.transform = "translateY(0)";
            twitterBtn.style.boxShadow = "none";
        };

        twitterBtn.onclick = () => {
            AuthService.getInstance().startTwitterLogin();
        };

        buttonsContainer.appendChild(twitterBtn);

        // Guest button (dev mode only)
        if (this.isDevMode()) {
            const guestBtn = document.createElement("button");
            guestBtn.style.cssText = `
                width: 100%;
                padding: 14px 24px;
                font-size: 14px;
                font-weight: 400;
                font-family: 'Outfit', sans-serif;
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                color: #666;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            guestBtn.textContent = "Continue as Guest (Dev)";

            guestBtn.onmouseover = () => {
                guestBtn.style.borderColor = "rgba(255, 255, 255, 0.2)";
                guestBtn.style.color = "#999";
            };
            guestBtn.onmouseout = () => {
                guestBtn.style.borderColor = "rgba(255, 255, 255, 0.1)";
                guestBtn.style.color = "#666";
            };

            guestBtn.onclick = async () => {
                guestBtn.textContent = "Connecting...";
                guestBtn.style.pointerEvents = "none";

                const guestAuth = GuestAuth.getInstance();
                await guestAuth.authenticate();

                if (guestAuth.getToken()) {
                    localStorage.setItem("loopia_auth_method", "guest");
                    this.fadeOutAndCallback();
                } else {
                    guestBtn.textContent = "Failed — try again";
                    guestBtn.style.pointerEvents = "auto";
                }
            };

            buttonsContainer.appendChild(guestBtn);
        }

        this.container.appendChild(buttonsContainer);
        document.body.appendChild(this.container);
    }

    private fadeOutAndCallback(): void {
        this.container.style.transition = "opacity 0.5s ease";
        this.container.style.opacity = "0";
        this.container.style.pointerEvents = "none";

        setTimeout(() => {
            this.container.remove();
            this.onAuthenticated();
        }, 500);
    }
}
