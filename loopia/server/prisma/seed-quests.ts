import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const quests = [
        {
            questKey: "grotto_explorer",
            name: "Grotto Explorer",
            description: "Play a game on Grotto Games, share your experience on X (Twitter), and submit the post link for admin review.",
            npcName: "Wrath",
            sceneKey: "grotto_room",
            questType: "link_submission",
            loopiReward: 15,
            xpReward: 50,
            requiresReview: true,
        },
        {
            questKey: "fishing",
            name: "Fishing Quest",
            description: "Catch a salmon from the river and bring it back. Patience is the key to a good catch!",
            npcName: "Secretsmo",
            sceneKey: "bears_room",
            questType: "fishing_minigame",
            loopiReward: 10,
            xpReward: 30,
            requiresReview: false,
        },
    ];

    for (const q of quests) {
        await prisma.quest.upsert({
            where: { questKey: q.questKey },
            update: q,
            create: q,
        });
        console.log(`Seeded quest: ${q.questKey}`);
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
