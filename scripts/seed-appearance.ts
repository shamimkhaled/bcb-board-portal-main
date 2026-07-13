import { seedAppearanceDefaults } from "../lib/theme";
import { prisma } from "../lib/prisma";

seedAppearanceDefaults()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeded appearance defaults.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
