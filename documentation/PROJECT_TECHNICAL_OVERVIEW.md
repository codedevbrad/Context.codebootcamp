# Contextio - Technical Project Overview

## Purpose

Contextio is a Next.js 16 application for organizing project work across:

- project metadata and structure
- long-form project writing files
- project task planning with domain-based kanban/gantt groupings
- ERM modeling views (graph + model representations)
- reusable "contexts" that can be attached to projects
- AI-assisted context conversations persisted to the database

The system is built as a server-first app using Prisma and Postgres, with client interactivity layered via SWR and React client components.

## Technology Stack

- Runtime/UI: Next.js 16 (App Router), React 19, TypeScript
- Styling/UI primitives: Tailwind CSS v4, Radix/shadcn-based components
- Data layer: Prisma 7 + PostgreSQL (Neon-compatible adapter present)
- Auth: NextAuth v5 beta + Prisma adapter
- Client data synchronization: SWR
- Rich content and visual modeling:
  - TipTap editor ecosystem
  - React Flow (`@xyflow/react`) for ERM graph visualization
- AI integration: OpenAI SDK (`openai`)

## High-Level Architecture

## Application Layers

1. **Routing and page composition (`src/app`)**
   - App Router pages load server data and compose domain components.
2. **Domain modules (`src/domains/*`)**
   - Each domain encapsulates server actions/data access and UI components.
3. **Data access and mutations**
   - Prisma queries and server actions are primarily in domain `db` modules.
4. **Client interactivity**
   - SWR hooks handle cache + optimistic-like list updates for sidebars/lists.
5. **Services**
   - External integrations such as OpenAI live under `src/services`.

## Route/Navigation Shape

Primary authenticated workspace routes are under `src/app/(project)/my`:

- `/my` workspace landing
- `/my/group/[groupid]` context group details + group context creation
- `/my/project/[projectid]` project overview
- `/my/project/[projectid]/tasks` domain/task planning
- `/my/project/[projectid]/erm` ERM editor/viewer
- `/my/project/[projectid]/files` and file detail routes
- `/my/project/[projectid]/context/[contextid]` project-context chat page

Auth entry points are under `src/app/(project)/auth`:

- `/auth/signin`
- `/auth/signup`

## Data Model (Prisma)

Schemas are split by concern in `prisma/schema/*.prisma`.

## Core Entities

- `User`
  - Owns projects, contexts, context groups, categories, writings, thoughts, gantt domains.
- `Project`
  - Core project object with:
    - `dbmodel Json` (ERM representation)
    - writings (`ProjectWriting`)
    - thoughts (`ProjectThought`)
    - task domain hierarchy (`ProjectGantdomains` + `GanttTasks`)
    - many-to-many relation with `Context` (`contexts Context[]`)
- `Context`
  - Reusable context object with:
    - `name`, `description`
    - `content Json @default("{}")` (used for serialized chat conversation storage)
    - optional `contextGroupId`
    - many-to-many project links (`projects Project[]`)

## Notable Relationship Patterns

- **Project <-> Context** is modeled as many-to-many.
- **ContextGroup -> Context** is one-to-many with nullable FK and `onDelete: SetNull`.
- Tasking model supports:
  - project -> many gantt domains
  - domain -> many tasks
  - task -> category

## Feature Modules

## 1) Project Sidebar + Workspace Navigation

Primary shell layout (`/my/layout.tsx`) fetches:

- all user context groups
- all user projects

Current implementation routes sidebar rendering through project sidebar tab component.
Project sidebar supports:

- create/update/delete project
- file accordion per project (writings list)
- context accordion per project
- in-place "new context" creation from project scope

## 2) Context Management

Context domain supports:

- listing context groups
- viewing group details with contained contexts
- creating contexts inside a group
- fetching single context details

Context records are user-scoped in server queries to enforce ownership boundaries.

## 3) Project Context AI Conversation

On `/my/project/[projectid]/context/[contextid]`, a client chat component provides:

- conversation rendering
- user question submission
- server action call to generate assistant response

Server action flow (`askContextQuestionAction` in context domain):

1. validate auth + context ownership
2. parse existing `Context.content` as conversation history
3. append user message
4. call OpenAI chat completion via `askOpenAI(...)`
5. append assistant reply
6. persist entire conversation back to `Context.content` as `JSON.stringify([...])`

This provides a single persisted conversation timeline per context.

## 4) Project Planning and ERM

- Tasks page loads gantt domains and categories and delegates interactivity to kanban component(s).
- ERM page supports dual representations:
  - React Flow view (graph)
  - model view (schema-like representation)
- ERM state is persisted to `Project.dbmodel`.

## State Management Strategy

## Server State

- SSR/Server component data fetch for initial route payloads.
- Domain server actions used for authenticated mutations.

## Client State

- SWR hooks for resource slices such as projects, project writings, and project contexts.
- Local UI state for modal/popover forms and optimistic list ordering by `updatedAt`.

## Security and Access Control

- Actions and reads resolve authenticated user from session.
- Most domain mutations/read paths verify ownership (`where: { id, userId }` style checks).
- Context and project operations are user-scoped to avoid cross-user access.

## Configuration and Environment

## Required Variables

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED` (used by Prisma config patterns)
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- optional: `OPENAI_MODEL` (defaults to `gpt-4o-mini`)

## Important Scripts

- `npm run dev` - local development
- `npm run build` - Prisma generate + Next build
- `npm run lint` / `npm run fulllint`
- `npm run db:migrate`
- `npm run db:generate`
- `npm run db:validate`

## Current Technical Characteristics

- Monolith-style app with clear domain folders.
- Server actions are first-class for mutation handling.
- JSON columns are used for flexible document-like data:
  - `Project.dbmodel`
  - rich editor content in writings/thoughts
  - context AI chat conversation in `Context.content`

## Recommended Next Engineering Enhancements

- Add structured conversation schema versioning in `Context.content`.
- Add token/window management + truncation policy for long chat histories.
- Add tests for server actions (authz, validation, and persistence behavior).
- Add explicit API/service error taxonomy for OpenAI failures.
- Add docs for deployment and migration workflow.

