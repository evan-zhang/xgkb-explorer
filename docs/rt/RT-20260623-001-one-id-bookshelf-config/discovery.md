# Discovery — Current Config & API Shape

## Current Code Touchpoints

- `src/lib/config.ts`
  - owns `SpaceEntry` schema and localStorage migration.
  - current fields: `id`, `name`, `spaceId`, `path`.
- `src/components/ConfigModal.tsx`
  - current add/edit form asks for name, space ID, and directory path.
- `src/lib/hooks.ts`
  - `useProjectsHub(client, personalProjectId, spaceId, spacePath)` loads projects.
  - empty `spaceId` + empty `path` means personal root.
  - non-empty path resolves segment-by-segment using folder names.
- `src/App.tsx`
  - chooses active space and passes `activeSpace.spaceId/path` into `useProjectsHub`.

## API Capability

Available calls:

- `getPersonalProjectId()` — resolves personal project ID from AppKey.
- `getLevel1Folders(projectId)` — lists root folders for a project/space ID.
- `getChildFiles(parentId)` — lists child files/folders for a folder ID.

This supports one-ID configuration if the app treats the ID as an entry point and auto-detects whether it is a folder root or project root.

## Design Implication

The new concept should not be “space ID + path”. It should be “bookshelf entry”. Internally that entry can resolve to either:

- project root: list with `getLevel1Folders(entryId)`
- folder root: list with `getChildFiles(entryId)`
- personal root: list with `getLevel1Folders(personalProjectId)`

## Risks

- Empty folders can look like successful folder IDs with zero children; invalid-vs-empty needs careful error handling.
- If old and new fields coexist, precedence must be explicit.
- Existing localStorage users must not lose spaces.
