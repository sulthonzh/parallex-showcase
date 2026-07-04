import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  const [user] = await sql`SELECT id FROM "user" LIMIT 1`;
  if (!user) { console.error("Sign in first."); process.exit(1); }
  const uid = user.id as string;
  console.log("Seeding for user:", uid);

  const p1 = randomUUID();
  const p2 = randomUUID();
  const p3 = randomUUID();

  await sql`INSERT INTO "project" (id, "developerId", slug, name, description, location, status, "heroImageUrl") VALUES (${p1}, ${uid}, ${'marina-bay-residences'}, ${'Marina Bay Residences'}, ${'Luxury waterfront living with panoramic marina views. Featuring 1-4 bedroom residences with world-class amenities.'}, ${'Dubai Marina, UAE'}, ${'published'}, ${'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600'})`;

  await sql`INSERT INTO "project" (id, "developerId", slug, name, description, location, status, "heroImageUrl") VALUES (${p2}, ${uid}, ${'skyline-tower'}, ${'Skyline Tower'}, ${'An iconic landmark redefining the city skyline. Premium residences with smart home technology and sky gardens.'}, ${'Business Bay, UAE'}, ${'published'}, ${'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600'})`;

  await sql`INSERT INTO "project" (id, "developerId", slug, name, description, location, status) VALUES (${p3}, ${uid}, ${'palm-villa-estate'}, ${'Palm Villa Estate'}, ${'Exclusive beachfront villas with private pools and direct beach access.'}, ${'Palm Jumeirah, UAE'}, ${'draft'})`;
  console.log("3 projects created");

  const assets: [string, string, string, string][] = [
    [p1, "gallery", "Living Room - Sunset View", "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200"],
    [p1, "gallery", "Master Bedroom", "https://images.unsplash.com/photo-1631048500301-7e85ed1a0fc4?w=1200"],
    [p1, "render", "Building Exterior - Night", "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200"],
    [p2, "gallery", "Sky Garden Terrace", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200"],
    [p2, "render", "Tower Facade", "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200"],
  ];
  for (const [pid, type, title, url] of assets) {
    const id = randomUUID();
    await sql`INSERT INTO "asset" (id, "projectId", type, status, title, url, "thumbnailUrl") VALUES (${id}, ${pid}, ${type}, ${'published'}, ${title}, ${url}, ${url})`;
  }
  console.log("5 assets created");

  const units: [string, string, string, number, number, number, number][] = [
    [p1, "A-101", "1-Bedroom Deluxe", 1, 1, 750, 350000],
    [p1, "A-1202", "2-Bedroom Premier", 2, 2, 1200, 520000],
    [p1, "P-2801", "4-Bedroom Penthouse", 4, 4, 3200, 2100000],
    [p2, "B-501", "Studio Smart", 0, 1, 450, 180000],
    [p2, "B-1501", "3-Bedroom Sky", 3, 3, 1850, 890000],
  ];
  for (const [pid, code, name, beds, baths, area, price] of units) {
    const id = randomUUID();
    await sql`INSERT INTO "unit" (id, "projectId", code, name, beds, baths, "areaSqft", price) VALUES (${id}, ${pid}, ${code}, ${name}, ${beds}, ${baths}, ${area}, ${price})`;
  }
  console.log("5 units created");
  console.log("Seed complete!");
}
seed().catch(e => { console.error(e); process.exit(1); });
