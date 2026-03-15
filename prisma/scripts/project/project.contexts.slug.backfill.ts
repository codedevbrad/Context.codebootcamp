import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

function getSlugSuffixFromContextId(contextId: string): string {
  return contextId.slice(-4);
}

function slugifyContextName(contextName: string): string {
  const normalized = contextName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "context";
}

async function run() {
  const contexts = await prisma.$queryRaw<
    Array<{ id: string; name: string; slug: string | null }>
  >`SELECT "id", "name", "slug" FROM "Context"`;

  let updatedCount = 0;
  let unchangedCount = 0;
  let malformedCount = 0;
  const collisionErrors: string[] = [];
  const malformedDetails: string[] = [];
  const updatedDetails: string[] = [];

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{4}$/;
  const pendingSlugs = new Set<string>();
  const expectedByContextId = new Map<string, string>();

  for (const context of contexts) {
    const slug = `${slugifyContextName(context.name)}-${getSlugSuffixFromContextId(context.id)}`;
    expectedByContextId.set(context.id, slug);

    if (pendingSlugs.has(slug)) {
      collisionErrors.push(
        `context ${context.id} => expected slug ${slug} collides with another generated slug`
      );
      continue;
    }

    pendingSlugs.add(slug);
  }

  if (collisionErrors.length > 0) {
    throw new Error(
      `[project.contexts.slug.backfill] slug collisions detected:\n${collisionErrors.join("\n")}`
    );
  }

  for (const context of contexts) {
    const slug = expectedByContextId.get(context.id);
    if (!slug) {
      throw new Error(
        `[project.contexts.slug.backfill] expected slug missing for context ${context.id}`
      );
    }

    if (context.slug && !slugPattern.test(context.slug)) {
      malformedCount += 1;
      malformedDetails.push(
        `context ${context.id} current=${context.slug} expected=${slug}`
      );
    }

    if (context.slug === slug) {
      unchangedCount += 1;
      continue;
    }

    await prisma.$executeRaw`UPDATE "Context" SET "slug" = ${slug} WHERE "id" = ${context.id}`;

    updatedDetails.push(
      `context ${context.id} from=${context.slug ?? "<null>"} to=${slug}`
    );
    updatedCount += 1;
  }

  console.log(
    `[project.contexts.slug.backfill] complete total=${contexts.length} updated=${updatedCount} unchanged=${unchangedCount} malformed=${malformedCount}`
  );

  if (malformedDetails.length > 0) {
    console.log("[project.contexts.slug.backfill] malformed slugs:");
    for (const detail of malformedDetails) {
      console.log(`  - ${detail}`);
    }
  }

  if (updatedDetails.length > 0) {
    console.log("[project.contexts.slug.backfill] updated records:");
    for (const detail of updatedDetails) {
      console.log(`  - ${detail}`);
    }
  }
}

run()
  .catch((error) => {
    console.error("[project.contexts.slug.backfill] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
