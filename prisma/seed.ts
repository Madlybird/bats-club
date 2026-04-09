import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Bats Club database...")

  const adminPw = await bcrypt.hash("admin123", 12)
  const userPw = await bcrypt.hash("pass123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@bats.club" },
    update: {},
    create: {
      email: "admin@bats.club",
      name: "Bats Lord",
      username: "batslord",
      password: adminPw,
      isAdmin: true,
      bio: "Curator of the Bats Club figure archive. Collector since 2008.",
    },
  })

  const collector = await prisma.user.upsert({
    where: { email: "collector@bats.club" },
    update: {},
    create: {
      email: "collector@bats.club",
      name: "Figure Fiend",
      username: "figurefiend",
      password: userPw,
      isAdmin: false,
      bio: "Passionate collector of scale figures, especially Re:Zero and Evangelion.",
    },
  })

  console.log("✓ Users created")

  // Clear existing data
  await prisma.articleFigure.deleteMany({})
  await prisma.article.deleteMany({})
  await prisma.userFigure.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.listing.deleteMany({})
  await prisma.figure.deleteMany({})

  // Figures
  const figureData = [
    {
      name: "Rem 1/7 Scale Figure",
      series: "Re:Zero − Starting Life in Another World",
      character: "Rem",
      manufacturer: "Good Smile Company",
      scale: "1/7",
      year: 2017,
      sculptor: "Takashi Inoue",
      material: "PVC/ABS",
      description: "Rem in her maid uniform, beautifully sculpted with her iconic blue twin tails.",
      imageUrl: "https://placehold.co/400x500/0f0f1a/a855f7?text=Rem+1%2F7",
    },
    {
      name: "Levi Ackerman 1/8 Scale Figure",
      series: "Attack on Titan",
      character: "Levi Ackerman",
      manufacturer: "Kotobukiya",
      scale: "1/8",
      year: 2019,
      sculptor: "Junnosuke Abe",
      material: "PVC/ABS",
      description: "Captain Levi in his Survey Corps uniform, mid-combat pose.",
      imageUrl: "https://placehold.co/400x500/0f0f1a/a855f7?text=Levi+1%2F8",
    },
    {
      name: "Rei Ayanami 1/6 Scale Figure",
      series: "Neon Genesis Evangelion",
      character: "Rei Ayanami",
      manufacturer: "Max Factory",
      scale: "1/6",
      year: 2020,
      sculptor: "Hiroshi Yukino",
      material: "PVC/ABS",
      description: "Rei Ayanami in plugsuit, based on the Rebuild of Evangelion design.",
      imageUrl: "https://placehold.co/400x500/0f0f1a/a855f7?text=Rei+1%2F6",
    },
    {
      name: "Nezuko Kamado 1/8 Scale Figure",
      series: "Demon Slayer: Kimetsu no Yaiba",
      character: "Nezuko Kamado",
      manufacturer: "Aniplex",
      scale: "1/8",
      year: 2021,
      sculptor: "Naoki Satou",
      material: "PVC/ABS",
      description: "Nezuko in her iconic kimono with bamboo mouthpiece, dynamic running pose.",
      imageUrl: "https://placehold.co/400x500/0f0f1a/db2777?text=Nezuko+1%2F8",
    },
    {
      name: "Zero Two 1/7 Scale Figure",
      series: "DARLING in the FranXX",
      character: "Zero Two",
      manufacturer: "Good Smile Company",
      scale: "1/7",
      year: 2020,
      sculptor: "Wataru Yamakami",
      material: "PVC/ABS",
      description: "Zero Two in her pilot suit with iconic pink horns.",
      imageUrl: "https://placehold.co/400x500/0f0f1a/db2777?text=Zero+Two+1%2F7",
    },
    {
      name: "Yor Forger 1/7 Scale Figure",
      series: "SPY x FAMILY",
      character: "Yor Forger",
      manufacturer: "Kotobukiya",
      scale: "1/7",
      year: 2023,
      sculptor: "Masahiro Nagata",
      material: "PVC/ABS",
      description: "Yor as Thorn Princess in her assassin outfit with rose thorn base.",
      imageUrl: "https://placehold.co/400x500/0f0f1a/a855f7?text=Yor+1%2F7",
    },
    {
      name: "Asuka Langley Soryu 1/4 Scale Figure",
      series: "Neon Genesis Evangelion",
      character: "Asuka Langley Soryu",
      manufacturer: "Wave",
      scale: "1/4",
      year: 2018,
      sculptor: "Hajime Ueda",
      material: "PVC/ABS",
      description: "Asuka in her red plugsuit — large-scale figure with exceptional detail.",
      imageUrl: "https://placehold.co/400x500/0f0f1a/db2777?text=Asuka+1%2F4",
    },
    {
      name: "Miku Nakano 1/7 Scale Figure",
      series: "The Quintessential Quintuplets",
      character: "Miku Nakano",
      manufacturer: "Chara-Ani",
      scale: "1/7",
      year: 2022,
      sculptor: "Keita Misonou",
      material: "PVC/ABS",
      description: "Miku in her school uniform with distinctive headphones, gentle smile expression.",
      imageUrl: "https://placehold.co/400x500/0f0f1a/a855f7?text=Miku+1%2F7",
    },
  ]

  await prisma.figure.createMany({ data: figureData })
  const allFigures = await prisma.figure.findMany({ orderBy: { createdAt: "asc" } })
  console.log(`✓ ${allFigures.length} figures created`)

  // Listings
  await prisma.listing.createMany({
    data: [
      {
        figureId: allFigures[0].id,
        sellerId: admin.id,
        price: 14999,
        condition: "Mint",
        stock: 2,
        photos: "[]",
        description: "Brand new in sealed box. Never opened. Original purchase from GSC online.",
        active: true,
      },
      {
        figureId: allFigures[2].id,
        sellerId: admin.id,
        price: 8999,
        condition: "Near Mint",
        stock: 1,
        photos: "[]",
        description: "Displayed 6 months on dust-free shelf. No yellowing, all accessories included.",
        active: true,
      },
      {
        figureId: allFigures[4].id,
        sellerId: admin.id,
        price: 12500,
        condition: "Good",
        stock: 1,
        photos: "[]",
        description: "Minor paint imperfection on back of hair, barely visible. Box has shelf wear.",
        active: true,
      },
    ],
  })
  console.log("✓ Listings created")

  // User figure statuses
  await prisma.userFigure.createMany({
    data: [
      { userId: collector.id, figureId: allFigures[0].id, status: "HAVE" },
      { userId: collector.id, figureId: allFigures[2].id, status: "HAVE" },
      { userId: collector.id, figureId: allFigures[1].id, status: "WISHLIST" },
      { userId: collector.id, figureId: allFigures[4].id, status: "WISHLIST" },
      { userId: collector.id, figureId: allFigures[3].id, status: "BUY" },
      { userId: admin.id,      figureId: allFigures[5].id, status: "HAVE" },
      { userId: admin.id,      figureId: allFigures[7].id, status: "WISHLIST" },
    ],
  })
  console.log("✓ User figure statuses created")

  // Articles
  const article1 = await prisma.article.create({
    data: {
      title: "Collector Spotlight: The Art of the Rem 1/7 Figure",
      slug: "collector-spotlight-rem-1-7",
      excerpt:
        "We dive deep into why Good Smile Company's Rem 1/7 remains the crown jewel of Re:Zero collections worldwide.",
      body: `In the world of anime figure collecting, few releases have generated as much excitement as Good Smile Company's Rem 1/7 scale figure. Released in 2017, this figure has become a benchmark for what a great scale figure can be.

The Sculpt

Sculptor Takashi Inoue captured Rem's delicate features with remarkable precision. Her twin tails flow naturally, and the fabric folds in her maid dress convey movement frozen in time. The base integrates perfectly with the figure's pose, giving it an anchored yet dynamic presence on any shelf.

Paint & Finish

GSC's paint application is flawless. The gradient shading on Rem's hair shifts from deep navy to vibrant blue at the tips. Her skin tones are warm and life-like, a far cry from the waxy look that plagued earlier figures from the early 2010s.

Why It Still Holds Up

Seven years on, the Rem 1/7 continues to command secondary market prices above its original retail. This speaks to both its quality and the enduring popularity of the character. For any serious collector, this figure is considered essential.

Display Tips

We recommend displaying Rem at eye level on a glass shelf with LED lighting positioned above and behind. This highlights the shading on her hair and the translucent elements of her sleeves beautifully.`,
      authorId: admin.id,
      published: true,
    },
  })

  const article2 = await prisma.article.create({
    data: {
      title: "The Evangelion Collection: Rei vs. Asuka — Which Scale Is Right for You?",
      slug: "evangelion-collection-rei-vs-asuka",
      excerpt:
        "Two iconic pilots, two different scales. We compare Max Factory's Rei 1/6 and Wave's Asuka 1/4 to help you decide.",
      body: `The rivalry between Rei Ayanami and Asuka Langley Soryu extends beyond the screen — it plays out daily on collector shelves around the world. Both figures represent the pinnacle of their respective manufacturers' capabilities, but they serve different collector needs.

Max Factory's Rei Ayanami 1/6

The 1/6 scale is often called the sweet spot of figure collecting — large enough to show detail, small enough to fit multiple figures on a standard shelf. Max Factory's 2020 release capitalises on this perfectly. The plugsuit's texture work is exceptional, with subtle panel lines and a matte finish that avoids the plastic sheen of lesser figures.

Wave's Asuka Langley Soryu 1/4

Going 1/4 scale is a statement. At this size, Wave's Asuka dominates any shelf she occupies. The larger format allows for detail work that simply isn't possible at smaller scales — you can see individual hair strands and the seams of her pilot suit.

Our Verdict

For collectors with limited space who want the best value for detail per centimetre: choose Rei 1/6. For collectors who want a centrepiece that commands a room: Asuka 1/4 is unmatched. Many serious Eva collectors own both — and that, perhaps, is the true answer.`,
      authorId: admin.id,
      published: true,
    },
  })

  await prisma.articleFigure.createMany({
    data: [
      { articleId: article1.id, figureId: allFigures[0].id },
      { articleId: article2.id, figureId: allFigures[2].id },
      { articleId: article2.id, figureId: allFigures[6].id },
    ],
  })

  console.log("✓ Articles created")
  console.log("")
  console.log("✅ Seed complete!")
  console.log("")
  console.log("Login credentials:")
  console.log("  Admin:     admin@bats.club     / admin123")
  console.log("  Collector: collector@bats.club / pass123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
