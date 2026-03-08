export class LoadingScreen {
    private static instance: LoadingScreen;

    private container: HTMLDivElement;
    private progressBar: HTMLDivElement;
    private progressText: HTMLParagraphElement;
    private isVisible = false;

    private constructor() {
        this.container = document.createElement('div');
        this.progressBar = document.createElement('div');
        this.progressText = document.createElement('p');
    }

    static getInstance(): LoadingScreen {
        if (!LoadingScreen.instance) {
            LoadingScreen.instance = new LoadingScreen();
        }
        return LoadingScreen.instance;
    }

    show(message?: string) {
        // If already visible, just update the message
        if (this.isVisible) {
            this.progressText.innerText = message || 'Loading...';
            this.container.style.opacity = '1';
            return;
        }

        this.isVisible = true;

        this.container.id = 'loading-screen';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgb(15, 15, 20), rgb(0, 0, 0));
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Outfit', sans-serif;
            color: white;
        `;

        // Clear previous children
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        // Glow
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40vw;
            height: 40vh;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(10, 10, 15, 0) 70%);
            border-radius: 50%;
            filter: blur(80px);
            z-index: -1;
            pointer-events: none;
        `;
        this.container.appendChild(glow);

        // Logo
        const logo = document.createElement('img');
        logo.src = 'assets/common/logo.png';
        logo.alt = 'LOOPIA Logo';
        logo.style.cssText = `
            width: 140px;
            height: auto;
            margin-bottom: 40px;
            filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.6));
            animation: float 6s ease-in-out infinite;
        `;
        this.container.appendChild(logo);

        // Progress bar container
        const barContainer = document.createElement('div');
        barContainer.style.cssText = `
            width: 300px;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 16px;
        `;

        // Progress bar fill
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #a855f7);
            border-radius: 3px;
            transition: width 0.3s ease;
        `;
        barContainer.appendChild(this.progressBar);
        this.container.appendChild(barContainer);

        // Progress text
        this.progressText = document.createElement('p');
        this.progressText.innerText = message || 'Loading...';
        this.progressText.style.cssText = `
            font-size: 14px;
            color: #a0a0b0;
            font-weight: 300;
            letter-spacing: 0.05em;
        `;
        this.container.appendChild(this.progressText);

        document.body.appendChild(this.container);
    }

    setProgress(value: number) {
        const percent = Math.round(value * 100);
        this.progressBar.style.width = `${percent}%`;
        if (percent >= 100) {
            this.progressText.innerText = 'Connecting...';
        } else {
            this.progressText.innerText = `Loading... ${percent}%`;
        }
    }

    hide() {
        if (!this.isVisible) return;
        this.container.style.transition = 'opacity 0.5s ease';
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.remove();
            this.isVisible = false;
        }, 500);
    }
}
