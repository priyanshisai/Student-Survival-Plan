import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient({});

async function main() {
  console.log("Seeding database...");

  // Seed campus locations
  const locations = [
    { name: "Nescafe", type: "cafe", description: "Popular hangout spot for coffee and snacks", isOpen: true },
    { name: "Main Cafeteria", type: "cafeteria", description: "Main dining area with affordable meals", isOpen: true },
    { name: "Central Library", type: "library", description: "Best place for focused study with AC", isOpen: true },
    { name: "OAT (Open Air Theatre)", type: "venue", description: "Events and cultural programs venue", isOpen: false },
    { name: "Computer Lab 1", type: "lab", description: "24/7 access for projects and assignments", isOpen: true },
    { name: "Computer Lab 2", type: "lab", description: "Advanced computing lab with GPUs", isOpen: true },
    { name: "Sports Complex", type: "sports", description: "Gym, badminton, basketball facilities", isOpen: true },
    { name: "Innovation Hub", type: "lab", description: "Startup incubation and project workspace", isOpen: false },
    { name: "Medical Center", type: "medical", description: "24/7 medical assistance", isOpen: true },
    { name: "Hostel Canteen", type: "cafeteria", description: "Late night snacks available", isOpen: true },
  ];

  for (const location of locations) {
    await prisma.campusLocation.upsert({
      where: { id: location.name.toLowerCase().replace(/\s+/g, "-") },
      update: location,
      create: {
        id: location.name.toLowerCase().replace(/\s+/g, "-"),
        ...location,
      },
    });
  }

  console.log("Seeded", locations.length, "campus locations");

  // Create some sample study groups
  const groups = [
    { id: "dsa-warriors", name: "DSA Warriors", description: "Crack coding interviews together! Daily practice sessions." },
    { id: "ml-enthusiasts", name: "ML Enthusiasts", description: "Explore machine learning projects and research papers." },
    { id: "web-dev-squad", name: "Web Dev Squad", description: "Build awesome web apps with React, Next.js, and more." },
    { id: "cp-grinders", name: "CP Grinders", description: "Competitive programming practice - Codeforces, LeetCode." },
  ];

  // Note: Study groups need a creator, so we'll skip this if no users exist
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("No users found. Skipping study group seeding.");
    console.log("Register a user first, then run seed again to create study groups.");
  }

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
