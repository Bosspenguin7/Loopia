/**
 * sync_obstacles.cjs
 *
 * Reads all .scene files, extracts Polygon objects with "obs_" prefix,
 * and updates shared/obstacles.ts with the extracted obstacle data.
 *
 * Usage: node scripts/sync_obstacles.cjs
 */

const fs = require("fs");
const path = require("path");

const SCENES_DIR = path.join(__dirname, "..", "src", "scenes");
const OBSTACLES_FILE = path.join(__dirname, "..", "..", "shared", "obstacles.ts");

// sceneKey → room type mapping
const SCENE_TO_ROOM = {
    Scene: "game_room",
    CafeScene: "cafe_room",
    bearsandsalmon: "bears_room",
    ApartmentScene: "apartment_room",
    avalabs: "avalabs_room",
    grotto: "grotto_room",
};

function extractObstacles(sceneFile) {
    const raw = fs.readFileSync(sceneFile, "utf-8");
    const scene = JSON.parse(raw);

    const sceneKey = scene.settings && scene.settings.sceneKey;
    if (!sceneKey) return null;

    const roomType = SCENE_TO_ROOM[sceneKey];
    if (!roomType) {
        console.warn(`  Unknown sceneKey "${sceneKey}" in ${path.basename(sceneFile)}, skipping`);
        return null;
    }

    const obstacles = [];
    for (const item of scene.displayList || []) {
        if (item.type === "Polygon" && item.label && item.label.startsWith("obs_")) {
            obstacles.push({
                name: item.label,
                centerX: item.x,
                centerY: item.y,
                points: item.points,
            });
        }
    }

    return { roomType, obstacles };
}

function formatObstacle(obs, indent) {
    const lines = [
        `${indent}{`,
        `${indent}    name: "${obs.name}",`,
        `${indent}    centerX: ${obs.centerX},`,
        `${indent}    centerY: ${obs.centerY},`,
        `${indent}    points: "${obs.points}"`,
        `${indent}}`,
    ];
    return lines.join("\n");
}

function updateObstaclesFile(roomObstacles) {
    let content = fs.readFileSync(OBSTACLES_FILE, "utf-8");

    for (const [roomType, obstacles] of Object.entries(roomObstacles)) {
        // Match the obstacles array for this room:
        //   roomType: {
        //       ...
        //       obstacles: [...]
        //   }
        const regex = new RegExp(
            `(${roomType}:\\s*\\{[^}]*?obstacles:\\s*)\\[[^\\]]*\\]`,
            "s"
        );

        if (!regex.test(content)) {
            console.warn(`  Could not find obstacles array for "${roomType}" in obstacles.ts`);
            continue;
        }

        let replacement;
        if (obstacles.length === 0) {
            replacement = "$1[]";
        } else {
            const indent = "            ";
            const formatted = obstacles.map((o) => formatObstacle(o, indent)).join(",\n");
            replacement = `$1[\n${formatted}\n        ]`;
        }

        content = content.replace(regex, replacement);
    }

    fs.writeFileSync(OBSTACLES_FILE, content, "utf-8");
}

// Main
function main() {
    const sceneFiles = fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith(".scene"));

    if (sceneFiles.length === 0) {
        console.log("No .scene files found.");
        return;
    }

    // Collect obstacles per room
    const roomObstacles = {};
    let totalCount = 0;

    for (const file of sceneFiles) {
        const filePath = path.join(SCENES_DIR, file);
        const result = extractObstacles(filePath);
        if (!result) continue;

        roomObstacles[result.roomType] = result.obstacles;
        totalCount += result.obstacles.length;
        if (result.obstacles.length > 0) {
            console.log(`  ${file}: ${result.obstacles.length} obstacle(s) → ${result.roomType}`);
        }
    }

    updateObstaclesFile(roomObstacles);
    console.log(`\nDone. ${totalCount} obstacle(s) synced to shared/obstacles.ts`);
}

main();
