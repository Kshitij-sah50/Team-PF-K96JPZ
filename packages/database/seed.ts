import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { locationsTable } from "./schema";

// Approximate destination coordinates. No unverified Bortle ratings are assigned.
const locations = [
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Hatu Temple area",
    type: "temple" as const,
    lat: 31.245,
    lng: 77.501,
    description:
      "Approximate temple-area destination near Narkanda. This is a cultural landmark, not a verified night-access observing site; check access and permissions locally.",
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Kartik Swami shrine area",
    type: "shrine" as const,
    lat: 30.381,
    lng: 79.084,
    description:
      "Approximate hilltop shrine-area destination in Uttarakhand. Night access and stargazing suitability are unverified; confirm local permissions and conditions.",
  },
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Hanle",
    type: "observatory" as const,
    lat: 32.779,
    lng: 78.964,
    description:
      "High-altitude destination in Ladakh. Check local permits and access before travelling.",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Kaza, Spiti Valley",
    type: "mountain" as const,
    lat: 32.224,
    lng: 78.071,
    description: "A mountain base in Spiti Valley. Conditions and road access vary seasonally.",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Javadi Hills",
    type: "mountain" as const,
    lat: 12.576,
    lng: 78.82,
    description:
      "A hill-region destination in Tamil Nadu. Find a permitted viewing area away from settlements.",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Mount Abu",
    type: "mountain" as const,
    lat: 24.592,
    lng: 72.715,
    description:
      "A hill destination in Rajasthan. Select an accessible viewing spot away from town lighting.",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await drizzle(pool).insert(locationsTable).values(locations).onConflictDoNothing();
    console.log("Watchtower locations seeded (existing records preserved).");
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
