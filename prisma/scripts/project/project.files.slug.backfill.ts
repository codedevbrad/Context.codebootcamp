import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

function getSlugSuffixFromFileId(fileId: string): string {
  return fileId.slice(-4);
}

function slugifyFileTitle(fileTitle: string): string {
  const normalized = fileTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "file";
}

async function run() {
  const files = await prisma.projectWriting.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  let updatedCount = 0;
  let unchangedCount = 0;
  let malformedCount = 0;
  const collisionErrors: string[] = [];
  const malformedDetails: string[] = [];
  const updatedDetails: string[] = [];

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{4}$/;
  const pendingSlugs = new Set<string>();
  const expectedByFileId = new Map<string, string>();

  for (const file of files) {
    const slug = `${slugifyFileTitle(file.title)}-${getSlugSuffixFromFileId(file.id)}`;
    expectedByFileId.set(file.id, slug);

    if (pendingSlugs.has(slug)) {
      collisionErrors.push(
        `file ${file.id} => expected slug ${slug} collides with another generated slug`
      );
      continue;
    }

    pendingSlugs.add(slug);
  }

  if (collisionErrors.length > 0) {
    throw new Error(
      `[project.files.slug.backfill] slug collisions detected:\n${collisionErrors.join("\n")}`
    );
  }

  for (const file of files) {
    const slug = expectedByFileId.get(file.id);
    if (!slug) {
      throw new Error(
        `[project.files.slug.backfill] expected slug missing for file ${file.id}`
      );
    }

    if (file.slug && !slugPattern.test(file.slug)) {
      malformedCount += 1;
      malformedDetails.push(`file ${file.id} current=${file.slug} expected=${slug}`);
    }

    if (file.slug === slug) {
      unchangedCount += 1;
      continue;
    }

    await prisma.projectWriting.update({
      where: { id: file.id },
      data: { slug },
    });

    updatedDetails.push(`file ${file.id} from=${file.slug ?? "<null>"} to=${slug}`);
    updatedCount += 1;
  }

  console.log(
    `[project.files.slug.backfill] complete total=${files.length} updated=${updatedCount} unchanged=${unchangedCount} malformed=${malformedCount}`
  );

  if (malformedDetails.length > 0) {
    console.log("[project.files.slug.backfill] malformed slugs:");
    for (const detail of malformedDetails) {
      console.log(`  - ${detail}`);
    }
  }

  if (updatedDetails.length > 0) {
    console.log("[project.files.slug.backfill] updated records:");
    for (const detail of updatedDetails) {
      console.log(`  - ${detail}`);
    }
  }
}

run()
  .catch((error) => {
    console.error("[project.files.slug.backfill] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
