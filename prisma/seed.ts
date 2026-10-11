import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@events.test";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123";

// Dates are relative to "now" so the sample data stays upcoming whenever the seed is run.
// hour/minute are in IST (UTC+5:30).
function daysFromNow(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour - 5, minute - 30, 0, 0);
  return d;
}

// Free Unsplash photos chosen to match each event (each URL was checked to load)
const img = (photoId: string) => `https://images.unsplash.com/photo-${photoId}?w=800&h=500&fit=crop&auto=format`;

const events = [
  // Active + upcoming
  { title: "Jazz Night at the Lake", category: "Music", city: "Coimbatore", startsAt: daysFromNow(3, 18, 30), price: 499, image: "1415201364774-f6f0bb35f28f", description: "An evening of live jazz by the Valankulam lake with local and touring bands." },
  { title: "Saturday Night Indie Gig", category: "Music", city: "Coimbatore", startsAt: daysFromNow(8, 20), price: 799, image: "1501386761578-eac5c94b800a", description: "Four indie bands from Tamil Nadu play original sets. Food stalls open from 7 PM." },
  { title: "Carnatic Morning Concert", category: "Music", city: "Chennai", startsAt: daysFromNow(5, 7), price: 0, image: "1507838153414-b4b713384a76", description: "A free morning concert of Carnatic classics at the Mylapore community hall." },
  { title: "Beginner Pottery Workshop", category: "Workshop", city: "Bengaluru", startsAt: daysFromNow(4, 10), price: 1500, image: "1493106641515-6b5631de4bb9", description: "Learn wheel throwing and hand building. All clay and tools provided." },
  { title: "3-Day Leadership Bootcamp", category: "Workshop", city: "Mumbai", startsAt: daysFromNow(20, 9), price: 150000, image: "1552664730-d307ca884978", description: "A residential programme for team leads covering communication, hiring and feedback." },
  { title: "Street Food Festival", category: "Food", city: "Chennai", startsAt: daysFromNow(6, 17), price: 0, image: "1555939594-58d7cb561ad1", description: "Over 40 stalls serving dosas, kothu parotta, chaat and desserts. Entry is free." },
  { title: "Kongu Food Fair", category: "Food", city: "Coimbatore", startsAt: daysFromNow(12, 12), price: 199, image: "1546833999-b9f581a1996d", description: "Taste traditional Kongu Nadu dishes cooked by home chefs from around the city." },
  { title: "Sunday 10K Run", category: "Sports", city: "Pune", startsAt: daysFromNow(9, 6), price: 650, image: "1452626038306-9aae5e071dd3", description: "A timed 10K run through the city with medals for every finisher." },
  { title: "Kids Science Fun Day", category: "Kids", city: "Bengaluru", startsAt: daysFromNow(10, 11), price: 350, image: "1532094349884-543bc11b234d", description: "Hands-on experiments, a planetarium show and a robotics corner for ages 6 to 12." },

  // Inactive (hidden from visitors, still visible to admin)
  { title: "Rooftop Night Acoustic Session", category: "Music", city: "Mumbai", startsAt: daysFromNow(7, 19), price: 999, image: "1510915361894-db8b60106cb1", description: "Unplugged sets on a rooftop with a view of the sea.", isActive: false },
  { title: "Weekend Football League", category: "Sports", city: "Chennai", startsAt: daysFromNow(14, 16), price: 2000, image: "1574629810360-7efbbe195018", description: "Five-a-side league for amateur teams. Register as a team of seven.", isActive: false },
  { title: "Kids Storytelling Hour", category: "Kids", city: "Pune", startsAt: daysFromNow(5, 16), price: 0, image: "1503454537195-1dcabb73ffb9", description: "Stories, puppets and songs for children aged 3 to 8.", isActive: false },

  // Past (hidden from visitors because the date has gone)
  { title: "Summer Night Music Fest", category: "Music", city: "Bengaluru", startsAt: daysFromNow(-10, 18), price: 1200, image: "1459749411175-04bf5292ceea", description: "A full-day festival with three stages and over twenty artists." },
  { title: "Photography Walk", category: "Workshop", city: "Coimbatore", startsAt: daysFromNow(-3, 7), price: 300, image: "1452587925148-ce544e77e70d", description: "A guided morning walk through the old town with tips on street photography." },
  { title: "Biryani Cook-off", category: "Food", city: "Mumbai", startsAt: daysFromNow(-1, 13), price: 250, image: "1563379091339-03b21ab4a4f8", description: "Home cooks compete for the best biryani in the city. Tasting included." },
];

async function main() {
  // Clear existing data so the seed can be run more than once
  await prisma.cardDesign.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.favouriteCategory.deleteMany();
  await prisma.event.deleteMany();

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "ADMIN",
    },
  });

  await prisma.event.createMany({
    data: events.map((e) => ({
      title: e.title,
      category: e.category,
      city: e.city,
      startsAt: e.startsAt,
      pricePaise: e.price * 100,
      description: e.description,
      imageUrl: img(e.image),
      isActive: e.isActive ?? true,
    })),
  });

  console.log(`Seeded admin (${ADMIN_EMAIL}) and ${events.length} events`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
