import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type Prisma } from "@prisma/client";
import {
  isProjectWritingContentV2,
  toProjectWritingContentV2,
} from "../../../src/domains/projects/writing/content";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function run() {
  const writings = await prisma.projectWriting.findMany({
    select: {
      id: true,
      content: true,
    },
  });

  let alreadyV2Count = 0;
  let updatedCount = 0;

  for (const writing of writings) {
    if (isProjectWritingContentV2(writing.content)) {
      alreadyV2Count += 1;
      continue;
    }

    const normalizedContent = toProjectWritingContentV2(writing.content);

    await prisma.projectWriting.update({
      where: { id: writing.id },
      data: {
        content: normalizedContent as unknown as Prisma.InputJsonValue,
      },
    });

    updatedCount += 1;
  }

  console.log(
    `[project.files.backfill] complete total=${writings.length} updated=${updatedCount} alreadyV2=${alreadyV2Count}`
  );
}

run()
  .catch((error) => {
    console.error("[project.files.backfill] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
