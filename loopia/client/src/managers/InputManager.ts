import Phaser from 'phaser';
import { Room } from 'colyseus.js';

interface ObsWorldPoly {
    points: { x: number; y: number }[];
}

export class InputManager {
    private scene: Phaser.Scene;
    private room: Room;
    private onMoveRequested: (targetX: number, targetY: number, onReached?: () => void) => void;
    private pointerHandler?: (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => void;
    private moveHandler?: (pointer: Phaser.Input.Pointer) => void;
    private hoverTile?: Phaser.GameObjects.Graphics;
    private obsPolygons: ObsWorldPoly[] = [];

    constructor(
        scene: Phaser.Scene,
        room: Room,
        onMoveRequested: (targetX: number, targetY: number, onReached?: () => void) => void
    ) {
        this.scene = scene;
        this.room = room;
        this.onMoveRequested = onMoveRequested;
    }

    /**
     * Hides obstacle polygons (obs_*) and collects them for hit-testing.
     *
     * Phaser Polygon created via `this.add.polygon(x, y, pointsString)`:
     *   - `child.x / child.y` = the position passed to add.polygon
     *   - `child.geom.points` = parsed points (local, relative to origin)
     *   - `child.originX / child.originY` = auto-centered to polygon bounds
     *   - `child.displayOriginX / child.displayOriginY` = pixel offset
     *
     * World point = child.x + geom.point - displayOrigin
     */
    public setupGrid(_width: number, _height: number, children: Phaser.GameObjects.GameObject[]) {
        this.obsPolygons = [];

        const processChild = (child: any) => {
            if (child.name && child.name.startsWith('obs_')) {
                child.setVisible(false);

                if (child.geom && child.geom.points) {
                    const ox = child.x - (child.displayOriginX || 0);
                    const oy = child.y - (child.displayOriginY || 0);
                    const pts = child.geom.points.map((p: any) => ({
                        x: ox + p.x,
                        y: oy + p.y,
                    }));
                    this.obsPolygons.push({ points: pts });
                }
            }
            if (child.list) {
                child.list.forEach(processChild);
            }
        };
        children.forEach(processChild);
    }

    /** Ray-casting point-in-polygon test */
    private isInsideObstacle(wx: number, wy: number): boolean {
        for (const poly of this.obsPolygons) {
            if (this.pointInPolygon(wx, wy, poly.points)) return true;
        }
        return false;
    }

    private pointInPolygon(x: number, y: number, pts: { x: number; y: number }[]): boolean {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x, yi = pts[i].y;
            const xj = pts[j].x, yj = pts[j].y;
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    public movePlayerTo(worldX: number, worldY: number, onReached?: () => void) {
        // Guard against sending to a closed connection
        if (!this.room || this.room.connection.isOpen === false) {
            return;
        }
        // Send move request to server — server does pathfinding
        this.room.send("moveRequest", { targetX: worldX, targetY: worldY });
        this.onMoveRequested(worldX, worldY, onReached);
    }

    public disableInput() {
        if (this.pointerHandler) {
            this.scene.input.off('pointerdown', this.pointerHandler);
            this.pointerHandler = undefined;
        }
        if (this.moveHandler) {
            this.scene.input.off('pointermove', this.moveHandler);
            this.moveHandler = undefined;
        }
        if (this.hoverTile) {
            this.hoverTile.destroy();
            this.hoverTile = undefined;
        }
    }

    public enableInput() {
        // Remove previous listener if enableInput() is called again
        if (this.pointerHandler) {
            this.scene.input.off('pointerdown', this.pointerHandler);
        }

        this.pointerHandler = (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
            // Ignore clicks on UI
            if (document.activeElement && document.activeElement.tagName === "INPUT") return;

            // Ignore clicks on DOM UI panels (profile card, trade window, etc.)
            const els = document.elementsFromPoint(pointer.x, pointer.y);
            if (els.some(el => (el as HTMLElement).closest?.(
                '#player-profile-card, #trade-window, #friend-list-panel, #messenger-panel, #emoji-picker-panel, #cafe-menu-panel'
            ))) return;

            // Ignore clicks on interactive objects (doors, buttons, etc.)
            if (gameObjects && gameObjects.length > 0) return;

            // Ignore clicks inside obstacle polygons
            if (this.isInsideObstacle(pointer.worldX, pointer.worldY)) return;

            this.movePlayerTo(pointer.worldX, pointer.worldY);
        };

        this.scene.input.on('pointerdown', this.pointerHandler);

        // Hover tile highlight
        this.hoverTile = this.scene.add.graphics();
        this.hoverTile.setDepth(999);

        const TW = 36;
        const TH = 18;
        let lastCX = -999;
        let lastCY = -999;

        this.moveHandler = (pointer: Phaser.Input.Pointer) => {
            if (!this.hoverTile) return;
            const wx = pointer.worldX;
            const wy = pointer.worldY;

            // Hide grid if inside obstacle
            if (this.isInsideObstacle(wx, wy)) {
                if (lastCX !== -999) {
                    this.hoverTile.clear();
                    lastCX = -999;
                    lastCY = -999;
                }
                return;
            }

            // Screen to iso tile index
            const fi = wx / TW + wy / TH;
            const fj = wy / TH - wx / TW;
            const ti = Math.floor(fi);
            const tj = Math.floor(fj);

            // Iso tile center back to screen
            const cx = (ti - tj) * TW * 0.5;
            const cy = (ti + tj) * TH * 0.5;

            if (cx === lastCX && cy === lastCY) return;
            lastCX = cx;
            lastCY = cy;

            const hw = TW / 2;
            const hh = TH / 2;

            this.hoverTile.clear();
            this.hoverTile.fillStyle(0xffffff, 0.35);
            this.hoverTile.beginPath();
            this.hoverTile.moveTo(cx, cy - hh);
            this.hoverTile.lineTo(cx + hw, cy);
            this.hoverTile.lineTo(cx, cy + hh);
            this.hoverTile.lineTo(cx - hw, cy);
            this.hoverTile.closePath();
            this.hoverTile.fillPath();
            this.hoverTile.lineStyle(2, 0xffffff, 0.5);
            this.hoverTile.beginPath();
            this.hoverTile.moveTo(cx, cy - hh);
            this.hoverTile.lineTo(cx + hw, cy);
            this.hoverTile.lineTo(cx, cy + hh);
            this.hoverTile.lineTo(cx - hw, cy);
            this.hoverTile.closePath();
            this.hoverTile.strokePath();
        };
        this.scene.input.on('pointermove', this.moveHandler);
    }
}
