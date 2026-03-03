"use client";

import { useMemo } from "react";
import type { ErmBoard, ErmModelColumn, ErmRelation } from "@/domains/projects/project/db";

type PrismaViewProps = {
  initialDbModel: unknown;
};

type NormalizedModel = {
  id: string;
  name: string;
  rows: ErmModelColumn[];
};

type NormalizedBoard = {
  models: NormalizedModel[];
  relations: ErmRelation[];
};

const PRISMA_FIELD_TYPES = new Set([
  "String",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "Boolean",
  "DateTime",
  "Json",
  "Bytes",
]);

function toSafeIdentifier(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[^a-zA-Z_]/, "_");

  return cleaned || fallback;
}

function toModelName(value: string, index: number) {
  const base = toSafeIdentifier(value, `Model${index + 1}`);
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function normalizeBoard(value: unknown): NormalizedBoard {
  if (!value || typeof value !== "object") {
    return { models: [], relations: [] };
  }

  const source = value as Partial<ErmBoard>;
  const rawModels = Array.isArray(source.models) ? source.models : [];
  const rawRelations = Array.isArray(source.relations) ? source.relations : [];

  const models: NormalizedModel[] = rawModels
    .map((model, index) => {
      if (!model || typeof model !== "object") {
        return null;
      }
      const candidate = model as {
        id?: unknown;
        name?: unknown;
        rows?: unknown;
      };
      const rows = Array.isArray(candidate.rows) ? candidate.rows : [];

      return {
        id: typeof candidate.id === "string" ? candidate.id : `model_${index}`,
        name:
          typeof candidate.name === "string" && candidate.name.trim()
            ? candidate.name
            : `model_${index + 1}`,
        rows: rows
          .map((row, rowIndex) => {
            if (!row || typeof row !== "object") {
              return null;
            }
            const candidateRow = row as {
              id?: unknown;
              name?: unknown;
              type?: unknown;
              nullable?: unknown;
              isPrimaryKey?: unknown;
              isForeignKey?: unknown;
            };

            if (typeof candidateRow.name !== "string" || !candidateRow.name.trim()) {
              return null;
            }

            const rowType =
              typeof candidateRow.type === "string" && PRISMA_FIELD_TYPES.has(candidateRow.type)
                ? candidateRow.type
                : "String";

            return {
              id: typeof candidateRow.id === "string" ? candidateRow.id : `${index}_${rowIndex}`,
              name: candidateRow.name,
              type: rowType,
              nullable: Boolean(candidateRow.nullable),
              isPrimaryKey: Boolean(candidateRow.isPrimaryKey),
              isForeignKey: Boolean(candidateRow.isForeignKey),
            };
          })
          .filter((row): row is ErmModelColumn => row !== null),
      };
    })
    .filter((model): model is NormalizedModel => model !== null);

  const relations: ErmRelation[] = rawRelations
    .map((relation) => {
      if (!relation || typeof relation !== "object") {
        return null;
      }
      const candidate = relation as {
        id?: unknown;
        source?: unknown;
        target?: unknown;
        relationType?: unknown;
      };

      if (typeof candidate.source !== "string" || typeof candidate.target !== "string") {
        return null;
      }

      const relationType: ErmRelation["relationType"] =
        candidate.relationType === "1:1" ||
        candidate.relationType === "1:N" ||
        candidate.relationType === "N:N"
          ? candidate.relationType
          : "1:N";

      return {
        id: typeof candidate.id === "string" ? candidate.id : `${candidate.source}_${candidate.target}`,
        source: candidate.source,
        target: candidate.target,
        relationType,
      };
    })
    .filter((relation): relation is ErmRelation => relation !== null);

  return { models, relations };
}

function createPrismaPreview(board: NormalizedBoard) {
  if (!board.models.length) {
    return "// No models yet. Create models in React Flow view.";
  }

  const modelNameById = new Map<string, string>();
  const lines: string[] = ["// Prisma model preview generated from your ERM board", ""];

  board.models.forEach((model, index) => {
    const modelName = toModelName(model.name, index);
    modelNameById.set(model.id, modelName);
    lines.push(`model ${modelName} {`);

    if (!model.rows.length) {
      lines.push("  // Add fields in the ERM editor");
    } else {
      model.rows.forEach((row, rowIndex) => {
        const fieldName = toSafeIdentifier(row.name, `field_${rowIndex + 1}`);
        const optionalMark = row.nullable ? "?" : "";
        const annotations = `${row.isPrimaryKey ? " @id" : ""}${row.isForeignKey ? " // FK" : ""}`;
        lines.push(`  ${fieldName} ${row.type}${optionalMark}${annotations}`);
      });
    }

    lines.push("}");
    lines.push("");
  });

  if (board.relations.length) {
    lines.push("// Relationship map");
    board.relations.forEach((relation) => {
      const sourceName = modelNameById.get(relation.source) ?? relation.source;
      const targetName = modelNameById.get(relation.target) ?? relation.target;
      lines.push(`// ${sourceName} ${relation.relationType} ${targetName}`);
    });
  }

  return lines.join("\n");
}

export default function PrismaView({ initialDbModel }: PrismaViewProps) {
  const board = useMemo(() => normalizeBoard(initialDbModel), [initialDbModel]);
  const preview = useMemo(() => createPrismaPreview(board), [board]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Model view shows a Prisma-style preview generated from your ERM board.
      </p>
      <pre className="max-h-[72vh] overflow-auto rounded-md border bg-muted/20 p-4 text-sm">
        <code>{preview}</code>
      </pre>
    </div>
  );
}
