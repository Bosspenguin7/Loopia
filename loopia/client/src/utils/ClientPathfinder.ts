import * as EasyStar from "easystarjs";
import { RoomObstacleConfig, ObstaclePolygon } from "@shared/obstacles";

interface Point {
    x: number;
    y: number;
}

export class ClientPathfinder {
    private finder: EasyStar.js;
    private grid: number[][] = [];
    private tileSize: number;
    private cols: number;
    private rows: number;

    constructor(config: RoomObstacleConfig) {
        this.tileSize = config.tileSize;
        this.cols = Math.ceil(config.mapWidth / this.tileSize);
        this.rows = Math.ceil(config.mapHeight / this.tileSize);

        // Initialize grid (0 = walkable)
        this.grid = [];
        for (let y = 0; y < this.rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = 0;
            }
        }

        // Process obstacles
        for (const obs of config.obstacles) {
            this.processObstacle(obs);
        }

        // Setup EasyStar
        this.finder = new EasyStar.js();
        this.finder.setGrid(this.grid);
        this.finder.setAcceptableTiles([0]);
        this.finder.enableDiagonals();
        this.finder.disableCornerCutting();
    }

    private parsePoints(pointStr: string): Point[] {
        const nums = pointStr.trim().split(/\s+/).map(Number);
        const points: Point[] = [];
        for (let i = 0; i < nums.length; i += 2) {
            points.push({ x: nums[i], y: nums[i + 1] });
        }
        return points;
    }

    private processObstacle(obs: ObstaclePolygon): void {
        const rawPoints = this.parsePoints(obs.points);
        if (rawPoints.length < 3) return;

        const minX = Math.min(...rawPoints.map(p => p.x));
        const maxX = Math.max(...rawPoints.map(p => p.x));
        const minY = Math.min(...rawPoints.map(p => p.y));
        const maxY = Math.max(...rawPoints.map(p => p.y));
        const displayOriginX = (maxX - minX) / 2;
        const displayOriginY = (maxY - minY) / 2;

        const worldPoints = rawPoints.map(p => ({
            x: obs.centerX + (p.x - displayOriginX),
            y: obs.centerY + (p.y - displayOriginY)
        }));

        const worldMinX = Math.min(...worldPoints.map(p => p.x));
        const worldMaxX = Math.max(...worldPoints.map(p => p.x));
        const worldMinY = Math.min(...worldPoints.map(p => p.y));
        const worldMaxY = Math.max(...worldPoints.map(p => p.y));

        const startCol = Math.floor(worldMinX / this.tileSize);
        const endCol = Math.floor(worldMaxX / this.tileSize);
        const startRow = Math.floor(worldMinY / this.tileSize);
        const endRow = Math.floor(worldMaxY / this.tileSize);

        // Mark edge tiles using Bresenham line rasterization
        for (let i = 0; i < worldPoints.length; i++) {
            const a = worldPoints[i];
            const b = worldPoints[(i + 1) % worldPoints.length];
            this.bresenhamMark(
                Math.floor(a.x / this.tileSize),
                Math.floor(a.y / this.tileSize),
                Math.floor(b.x / this.tileSize),
                Math.floor(b.y / this.tileSize)
            );
        }

        // Fill interior cells using point-in-polygon test
        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
                    const cellX = x * this.tileSize + (this.tileSize / 2);
                    const cellY = y * this.tileSize + (this.tileSize / 2);
                    if (this.pointInPolygon(cellX, cellY, worldPoints)) {
                        this.grid[y][x] = 1;
                    }
                }
            }
        }
    }

    private bresenhamMark(x0: number, y0: number, x1: number, y1: number): void {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (y0 >= 0 && y0 < this.rows && x0 >= 0 && x0 < this.cols) {
                this.grid[y0][x0] = 1;
            }
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    private pointInPolygon(px: number, py: number, polygon: Point[]): boolean {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    private smoothPath(path: Point[]): Point[] {
        if (path.length <= 2) return path;

        const smoothed: Point[] = [path[0]];
        let current = 0;

        while (current < path.length - 1) {
            let farthest = current + 1;
            for (let i = current + 2; i < path.length; i++) {
                if (this.hasLineOfSight(path[current], path[i])) {
                    farthest = i;
                }
            }
            smoothed.push(path[farthest]);
            current = farthest;
        }

        return smoothed;
    }

    private hasLineOfSight(from: Point, to: Point): boolean {
        let x0 = from.x;
        let y0 = from.y;
        const x1 = to.x;
        const y1 = to.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (this.grid[y0] && this.grid[y0][x0] === 1) {
                return false;
            }
            if (x0 === x1 && y0 === y1) {
                return true;
            }
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    public findPath(fromX: number, fromY: number, toX: number, toY: number): Promise<Point[] | null> {
        const startCol = Math.floor(fromX / this.tileSize);
        const startRow = Math.floor(fromY / this.tileSize);
        let endCol = Math.floor(toX / this.tileSize);
        let endRow = Math.floor(toY / this.tileSize);

        // Clamp to grid bounds
        endCol = Math.max(0, Math.min(this.cols - 1, endCol));
        endRow = Math.max(0, Math.min(this.rows - 1, endRow));

        // If destination is blocked, find nearest walkable tile
        if (this.grid[endRow]?.[endCol] === 1) {
            const nearest = this.findNearestWalkable(endCol, endRow);
            if (nearest) {
                endCol = nearest.x;
                endRow = nearest.y;
            } else {
                return Promise.resolve(null);
            }
        }

        return new Promise((resolve) => {
            this.finder.findPath(startCol, startRow, endCol, endRow, (path: Point[] | null) => {
                if (path === null || path.length === 0) {
                    resolve(null);
                } else {
                    resolve(this.smoothPath(path));
                }
            });
            this.finder.calculate();
        });
    }

    private findNearestWalkable(col: number, row: number): Point | null {
        const maxRadius = 10;
        for (let r = 1; r <= maxRadius; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    const ny = row + dy;
                    const nx = col + dx;
                    if (ny >= 0 && ny < this.rows && nx >= 0 && nx < this.cols) {
                        if (this.grid[ny][nx] === 0) {
                            return { x: nx, y: ny };
                        }
                    }
                }
            }
        }
        return null;
    }

    public getTileSize(): number {
        return this.tileSize;
    }
}
