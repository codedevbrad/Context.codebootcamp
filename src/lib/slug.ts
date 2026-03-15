const PROJECT_SLUG_WITH_SUFFIX_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([a-z0-9]{4})$/;
const FILE_SLUG_WITH_SUFFIX_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([a-z0-9]{4})$/;
const CONTEXT_SLUG_WITH_SUFFIX_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([a-z0-9]{4})$/;

export function normalizeProjectSlugRouteRef(projectRef: string): string {
  return projectRef.trim().toLowerCase();
}

export function parseProjectSlug(projectRef: string): {
  fullSlug: string;
  baseSlug: string;
  suffix: string | null;
} {
  const fullSlug = normalizeProjectSlugRouteRef(projectRef);
  const match = PROJECT_SLUG_WITH_SUFFIX_PATTERN.exec(fullSlug);

  if (!match) {
    return {
      fullSlug,
      baseSlug: fullSlug,
      suffix: null,
    };
  }

  return {
    fullSlug,
    baseSlug: match[1],
    suffix: match[2],
  };
}

export function getProjectBaseSlug(projectRef: string): string {
  return parseProjectSlug(projectRef).baseSlug;
}

export function slugifyProjectName(projectName: string): string {
  const normalized = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "project";
}

export function buildProjectSlug(projectName: string, projectId: string): string {
  const suffix = projectId.slice(-4).toLowerCase();
  return `${slugifyProjectName(projectName)}-${suffix}`;
}

export function normalizeFileSlugRouteRef(fileRef: string): string {
  return fileRef.trim().toLowerCase();
}

export function parseFileSlug(fileRef: string): {
  fullSlug: string;
  baseSlug: string;
  suffix: string | null;
} {
  const fullSlug = normalizeFileSlugRouteRef(fileRef);
  const match = FILE_SLUG_WITH_SUFFIX_PATTERN.exec(fullSlug);

  if (!match) {
    return {
      fullSlug,
      baseSlug: fullSlug,
      suffix: null,
    };
  }

  return {
    fullSlug,
    baseSlug: match[1],
    suffix: match[2],
  };
}

export function getFileBaseSlug(fileRef: string): string {
  return parseFileSlug(fileRef).baseSlug;
}

export function slugifyFileTitle(fileTitle: string): string {
  const normalized = fileTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "file";
}

export function buildFileSlug(fileTitle: string, fileId: string): string {
  const suffix = fileId.slice(-4).toLowerCase();
  return `${slugifyFileTitle(fileTitle)}-${suffix}`;
}

export function normalizeContextSlugRouteRef(contextRef: string): string {
  return contextRef.trim().toLowerCase();
}

export function parseContextSlug(contextRef: string): {
  fullSlug: string;
  baseSlug: string;
  suffix: string | null;
} {
  const fullSlug = normalizeContextSlugRouteRef(contextRef);
  const match = CONTEXT_SLUG_WITH_SUFFIX_PATTERN.exec(fullSlug);

  if (!match) {
    return {
      fullSlug,
      baseSlug: fullSlug,
      suffix: null,
    };
  }

  return {
    fullSlug,
    baseSlug: match[1],
    suffix: match[2],
  };
}

export function getContextBaseSlug(contextRef: string): string {
  return parseContextSlug(contextRef).baseSlug;
}

export function slugifyContextName(contextName: string): string {
  const normalized = contextName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "context";
}

export function buildContextSlug(contextName: string, contextId: string): string {
  const suffix = contextId.slice(-4).toLowerCase();
  return `${slugifyContextName(contextName)}-${suffix}`;
}
