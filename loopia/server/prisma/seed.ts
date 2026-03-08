import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  for (let i = 1; i <= 10; i++) {
    await prisma.room.upsert({
      where: { name: `room_${i}` },
      update: {},
      create: {
        name: `room_${i}`,
        displayName: `Room ${i}`,
        maxClients: 50,
        roomType: "game_room",
        sceneKey: "Scene",
        isActive: true,
        sortOrder: i,
      },
    });
  }

  console.log("Seeded 10 rooms.");

  // Seed shop items
  const items = [
    { name: "Party Hat", description: "A festive party hat for celebrations", category: "cosmetic", priceAvax: "0.01", iconEmoji: "\u{1F389}", sortOrder: 1 },
    { name: "Cool Shades", description: "Stylish sunglasses for the cool kids", category: "cosmetic", priceAvax: "0.02", iconEmoji: "\u{1F576}", sortOrder: 2 },
    { name: "Golden Crown", description: "A majestic golden crown fit for royalty", category: "cosmetic", priceAvax: "0.05", iconEmoji: "\u{1F451}", sortOrder: 3 },
    { name: "Magic Wand", description: "A sparkly magic wand with mystical powers", category: "cosmetic", priceAvax: "0.03", iconEmoji: "\u{1FA84}", sortOrder: 4 },
    { name: "Top Hat", description: "A classy top hat for distinguished players", category: "cosmetic", priceAvax: "0.02", iconEmoji: "\u{1F3A9}", sortOrder: 5 },
    { name: "Star Badge", description: "A shining star badge of honor", category: "cosmetic", priceAvax: "0.01", iconEmoji: "\u{2B50}", sortOrder: 6 },
    { name: "Diamond Ring", description: "A dazzling diamond ring", category: "cosmetic", priceAvax: "0.04", iconEmoji: "\u{1F48D}", sortOrder: 7 },
    { name: "Rocket Pack", description: "A futuristic rocket jetpack", category: "cosmetic", priceAvax: "0.05", iconEmoji: "\u{1F680}", sortOrder: 8 },
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: { priceAvax: item.priceAvax, iconEmoji: item.iconEmoji, description: item.description, sortOrder: item.sortOrder },
      create: item,
    });
  }

  console.log(`Seeded ${items.length} shop items.`);

  // Seed cafe food items (Loopi currency)
  const cafeItems = [
    { name: "Coffee", description: "A hot cup of freshly brewed coffee", category: "cafe_food", priceAvax: "0", priceLoopi: 10, iconEmoji: "\u2615", sortOrder: 100 },
    { name: "Sandwich", description: "A delicious sandwich with fresh ingredients", category: "cafe_food", priceAvax: "0", priceLoopi: 25, iconEmoji: "\u{1F96A}", sortOrder: 101 },
    { name: "Hamburger", description: "A juicy hamburger with all the fixings", category: "cafe_food", priceAvax: "0", priceLoopi: 50, iconEmoji: "\u{1F354}", sortOrder: 102 },
  ];

  for (const item of cafeItems) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: { priceLoopi: item.priceLoopi, iconEmoji: item.iconEmoji, description: item.description, sortOrder: item.sortOrder, category: item.category },
      create: item,
    });
  }

  console.log(`Seeded ${cafeItems.length} cafe food items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
