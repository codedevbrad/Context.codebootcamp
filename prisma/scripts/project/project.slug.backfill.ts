import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

function getSlugFromProjectId(projectId: string): string {
  return projectId.slice(-4);
}

function slugifyProjectName(projectName: string): string {
  const normalized = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "project";
}

async function run() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
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

  const expectedByProjectId = new Map<string, string>();

  for (const project of projects) {
    const slug = `${slugifyProjectName(project.name)}-${getSlugFromProjectId(project.id)}`;
    expectedByProjectId.set(project.id, slug);

    if (pendingSlugs.has(slug)) {
      collisionErrors.push(
        `project ${project.id} => expected slug ${slug} collides with another generated slug`
      );
      continue;
    }

    pendingSlugs.add(slug);
  }

  if (collisionErrors.length > 0) {
    throw new Error(
      `[project.slug.backfill] slug collisions detected:\n${collisionErrors.join("\n")}`
    );
  }

  for (const project of projects) {
    const slug = expectedByProjectId.get(project.id);
    if (!slug) {
      throw new Error(
        `[project.slug.backfill] expected slug missing for project ${project.id}`
      );
    }

    if (project.slug && !slugPattern.test(project.slug)) {
      malformedCount += 1;
      malformedDetails.push(
        `project ${project.id} current=${project.slug} expected=${slug}`
      );
    }

    if (project.slug === slug) {
      unchangedCount += 1;
      continue;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { slug },
    });

    updatedDetails.push(
      `project ${project.id} from=${project.slug ?? "<null>"} to=${slug}`
    );
    updatedCount += 1;
  }

  console.log(
    `[project.slug.backfill] complete total=${projects.length} updated=${updatedCount} unchanged=${unchangedCount} malformed=${malformedCount}`
  );
  if (malformedDetails.length > 0) {
    console.log("[project.slug.backfill] malformed slugs:");
    for (const detail of malformedDetails) {
      console.log(`  - ${detail}`);
    }
  }
  if (updatedDetails.length > 0) {
    console.log("[project.slug.backfill] updated records:");
    for (const detail of updatedDetails) {
      console.log(`  - ${detail}`);
    }
  }
}

run()
  .catch((error) => {
    console.error("[project.slug.backfill] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
