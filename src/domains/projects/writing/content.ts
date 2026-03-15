export const PROJECT_WRITING_CONTENT_VERSION = 2;

export const EMPTY_TIPTAP_DOC: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type ProjectWritingPage = {
  id: string;
  title: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProjectWritingContentV2 = {
  version: typeof PROJECT_WRITING_CONTENT_VERSION;
  pages: ProjectWritingPage[];
  activePageId: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function cloneRecord(value: Record<string, unknown>) {
  try {
    const cloned = JSON.parse(JSON.stringify(value)) as unknown;
    return asRecord(cloned) ?? { ...value };
  } catch {
    return { ...value };
  }
}

function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `page_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

function normalizeTiptapDoc(content: unknown): Record<string, unknown> {
  const record = asRecord(content);
  if (!record) {
    return cloneRecord(EMPTY_TIPTAP_DOC);
  }

  if (record.type !== "doc") {
    return cloneRecord(EMPTY_TIPTAP_DOC);
  }

  return cloneRecord(record);
}

function createPage(
  pageTitle = "Page 1",
  pageContent?: unknown,
  createdAtIso?: string,
  id?: string
): ProjectWritingPage {
  const now = createdAtIso ?? new Date().toISOString();

  return {
    id: id?.trim() || createId(),
    title: pageTitle.trim() || "Untitled page",
    content: normalizeTiptapDoc(pageContent),
    createdAt: now,
    updatedAt: now,
  };
}

export function isProjectWritingContentV2(value: unknown): value is ProjectWritingContentV2 {
  const root = asRecord(value);
  if (!root) {
    return false;
  }

  if (root.version !== PROJECT_WRITING_CONTENT_VERSION) {
    return false;
  }

  if (!Array.isArray(root.pages) || root.pages.length === 0) {
    return false;
  }

  if (typeof root.activePageId !== "string" || !root.activePageId.trim()) {
    return false;
  }

  return root.pages.every((candidate) => {
    const page = asRecord(candidate);
    if (!page) {
      return false;
    }

    return (
      typeof page.id === "string" &&
      page.id.trim().length > 0 &&
      typeof page.title === "string" &&
      page.title.trim().length > 0 &&
      typeof page.createdAt === "string" &&
      page.createdAt.length > 0 &&
      typeof page.updatedAt === "string" &&
      page.updatedAt.length > 0 &&
      Boolean(asRecord(page.content))
    );
  });
}

export function createProjectWritingContentV2() {
  const firstPage = createPage("Page 1");

  return {
    version: PROJECT_WRITING_CONTENT_VERSION,
    pages: [firstPage],
    activePageId: firstPage.id,
  } satisfies ProjectWritingContentV2;
}

export function toProjectWritingContentV2(content: unknown): ProjectWritingContentV2 {
  if (!isProjectWritingContentV2(content)) {
    const legacyRecord = asRecord(content);
    if (!legacyRecord) {
      return createProjectWritingContentV2();
    }

    const firstPage = createPage("Page 1", legacyRecord);
    return {
      version: PROJECT_WRITING_CONTENT_VERSION,
      pages: [firstPage],
      activePageId: firstPage.id,
    };
  }

  const root = content as ProjectWritingContentV2;
  const now = new Date().toISOString();
  const normalizedPages = root.pages.map((rawPage, index) => {
    const pageRecord = asRecord(rawPage);

    if (!pageRecord) {
      return createPage(`Page ${index + 1}`);
    }

    return createPage(
      typeof pageRecord.title === "string" ? pageRecord.title : `Page ${index + 1}`,
      pageRecord.content,
      typeof pageRecord.createdAt === "string" ? pageRecord.createdAt : now,
      typeof pageRecord.id === "string" ? pageRecord.id : undefined
    );
  });

  if (normalizedPages.length === 0) {
    return createProjectWritingContentV2();
  }

  const activePageId = normalizedPages.some((page) => page.id === root.activePageId)
    ? root.activePageId
    : normalizedPages[0].id;

  return {
    version: PROJECT_WRITING_CONTENT_VERSION,
    pages: normalizedPages,
    activePageId,
  };
}

export function addProjectWritingPage(content: unknown, title?: string): ProjectWritingContentV2 {
  const normalized = toProjectWritingContentV2(content);
  const nextPageNumber = normalized.pages.length + 1;
  const page = createPage(title || `Page ${nextPageNumber}`);

  return {
    ...normalized,
    pages: [...normalized.pages, page],
    activePageId: page.id,
  };
}

export function renameProjectWritingPage(
  content: unknown,
  pageId: string,
  title: string
): ProjectWritingContentV2 | null {
  const normalized = toProjectWritingContentV2(content);
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return null;
  }

  let hasMatch = false;
  const pages = normalized.pages.map((page) => {
    if (page.id !== pageId) {
      return page;
    }

    hasMatch = true;
    return {
      ...page,
      title: trimmedTitle,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!hasMatch) {
    return null;
  }

  return {
    ...normalized,
    pages,
  };
}

export function deleteProjectWritingPage(
  content: unknown,
  pageId: string
): ProjectWritingContentV2 | null {
  const normalized = toProjectWritingContentV2(content);
  if (normalized.pages.length <= 1) {
    return null;
  }

  const nextPages = normalized.pages.filter((page) => page.id !== pageId);
  if (nextPages.length === normalized.pages.length) {
    return null;
  }

  const activePageId =
    normalized.activePageId === pageId
      ? nextPages[Math.max(0, nextPages.length - 1)].id
      : normalized.activePageId;

  return {
    ...normalized,
    pages: nextPages,
    activePageId,
  };
}

export function setActiveProjectWritingPage(
  content: unknown,
  pageId: string
): ProjectWritingContentV2 | null {
  const normalized = toProjectWritingContentV2(content);
  const hasMatch = normalized.pages.some((page) => page.id === pageId);

  if (!hasMatch) {
    return null;
  }

  return {
    ...normalized,
    activePageId: pageId,
  };
}

export function updateProjectWritingPageContent(
  content: unknown,
  pageId: string,
  pageContent: unknown
): ProjectWritingContentV2 | null {
  const normalized = toProjectWritingContentV2(content);
  const nextContent = normalizeTiptapDoc(pageContent);
  let hasMatch = false;

  const pages = normalized.pages.map((page) => {
    if (page.id !== pageId) {
      return page;
    }

    hasMatch = true;
    return {
      ...page,
      content: nextContent,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!hasMatch) {
    return null;
  }

  return {
    ...normalized,
    pages,
    activePageId: pageId,
  };
}
