---
sidebar_position: 4
title: Developer Guide
---

# SeaScope Developer Guide

This guide explains how SeaScope is assembled, where the important code lives, and how to extend it safely.

---

## Environment setup

### Frontend environment variables

In `gendox-frontend/.env.local`:

- **`NEXT_PUBLIC_GEE_CLIENT_ID`**: Google OAuth client id used for Earth Engine authentication.
- **`NEXT_PUBLIC_MAPS_API_KEY`**: used by map-related features (if enabled in your build).
- **`NEXT_PUBLIC_GENDOX_URL`**: base URL of the Gendox API.

### Run the apps locally

Frontend:

```bash
cd gendox-frontend
yarn install
yarn dev
```

Backend:

```bash
cd gendox-core-api
mvn clean install
mvn spring-boot:run
```

---

## Key frontend modules (where to look first)

### Routing and layout

- `gendox-frontend/src/pages/gendox/tasks/earth-observation/workspace/index.js`: Next.js entry route (client-only page).
- `gendox-frontend/src/layouts/EarthObservationLayout.js`: full-width layout (sidebar hidden).
- `gendox-frontend/src/views/pages/earth-observation/EarthObservationWorkspacePage.js`: top-level workspace, task loading, guards.

### Layout engine

- `gendox-frontend/src/views/pages/earth-observation/layout/WorkspaceGrid.js`: always-mounted 3-panel grid.
- `gendox-frontend/src/views/pages/earth-observation/layout/hooks/useWorkspaceLayout.js`: splitters, maximize/minimize, resize clamping.

### Panels

- `.../panels/map/MapPanel.js`: Leaflet map, AOIs, screenshots, exports UI.
- `.../panels/editor/EditorPanel.js`: Monaco editor, scripts/version menu, run button integration.
- `.../panels/chat/ChatPanel.js`: loads `gendox-widget-plugin.js`, provides local context + tools.

### Shared refs (cross-panel bridge)

- `.../panels/shared/panelState.js`: module-level refs used by Chat ↔ Editor ↔ Runner integration.

---

## GEE execution: `GeeRunner` + sandbox iframe

SeaScope executes EE scripts in the browser using a hidden iframe:

- **Runner**: `gendox-frontend/src/views/pages/earth-observation/gee/GeeRunner/`
- **Sandbox HTML**: `gendox-frontend/public/gee-sandbox/gee-sandbox.html`

### Why an iframe

- keeps EE execution isolated from React UI
- enforces a strict input/output interface (messages)
- supports “fresh runtime per run” by remounting the iframe

### Adding new outputs to the sandbox

When you add a new capability (e.g., a new event for legend generation):

1. Implement the behavior in `gee-sandbox.html`.
2. Define a new `postMessage` event type.
3. Handle it in the parent message handler (see the hooks under `GeeRunner`).
4. Update Redux slice state if it becomes part of persistent UI state.

---

## Sandbox message protocol reference

### Parent → iframe

- `EXECUTE`: execute code with `{ token, geometries }`.
- `GEE_FETCH_OPERATION`: poll an export/operation status.
- `CANCEL_EXPORT`: cancel an export operation.
- `GET_THUMB`: request a thumbnail/screenshot capture.

### Iframe → parent

- `IFRAME_READY`: sandbox ready.
- `SUCCESS`: execution completed (includes layer additions).
- `ERROR`: execution failed.
- `PRINT`: log message from EE `print`.
- `CENTER`: update map center.
- `ZOOM`: zoom request.
- `CLEAR_LAYERS`: clear overlays.
- `MAP_OPTIONS`: map configuration updates.
- `THUMBNAIL` / `SCREENSHOT`: capture result metadata.
- `EXPORT_STARTED`: a new export/operation began.
- `GEE_OPERATION_RESULT`: operation poll response.

---

## Redux store (Earth Observation slice)

SeaScope maintains state under:

`gendox-frontend/src/store/earthObservation/`

Key areas:

- **layout**: split positions + maximize/minimize mode
- **map**: layers, prints, errors, screenshots, exports
- **scripts**: EOScript list, latest script, saving/loading state
- **geometries**: AOIs with ordering + visibility toggles

Persistence is done through thunks that call `earthObservationService.js`.

---

## Backend APIs (EO persistence layer)

The backend does **not** execute Earth Engine code. It persists scripts and AOIs for an EO task.

Base path:

`/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/earth-observation`

### Scripts

- `GET /eo-scripts`: list versions (newest first)
- `POST /eo-scripts`: create a new version (dedup if unchanged)
- `GET /eo-scripts/latest`: fetch latest version

### Geometries (AOIs)

- `GET /eo-geometries`: list AOIs for the task
- `POST /eo-geometries`: create AOI
- `PUT /eo-geometries/{geometryId}`: update AOI (title/coords/order)
- `DELETE /eo-geometries/{geometryId}`: delete one AOI
- `DELETE /eo-geometries`: delete all AOIs for the task

Implementation reference:

- `gendox-core-api/.../controller/EarthObservationController.java`
- `gendox-core-api/.../services/EOScriptService.java`
- `gendox-core-api/.../services/EOTaskGeometryService.java`

---

## Extending SeaScope

### Add a new tool the agent can call (backend)

1. Implement a new `AiToolHandler` in `gendox-core-api/.../ai/engine/tools/`.
2. Register it in the tool registry (where handlers are wired).
3. Add the tool JSON schema to the agent configuration so the model knows the tool exists.
4. Ensure tool responses are stable, structured JSON (so the model can reliably use them).

Note: some tools are “browser-only” (executed in the UI). The backend can intentionally stub these when the tool requires no server-side action.

### Add a new tool the agent can call (frontend / SeaScope)

1. Expose a handler through `window.gendox.tools` (see `ChatPanel` / editor hooks).
2. Make the tool mutate editor state, trigger a run, or update Redux state.
3. Add a corresponding tool schema to the agent configuration so the model can invoke it.

### Add a new panel

1. Create a panel component under `src/views/pages/earth-observation/panels/`.
2. Add it to `WorkspaceGrid.js`.
3. If it needs global state, extend the EO slice under `src/store/earthObservation/`.

---

## Database migrations (EO tables)

EO persistence is stored in the core database (schema `gendox_core`), typically as:

- `eo_scripts`: versioned script content per task
- `eo_task_geometries`: AOIs as JSONB coordinates + ordering

When evolving the schema:

- add a forward-only Flyway migration under `database/src/main/resources/db/migrations/gendox-core/`
- follow naming `V[YYYYMMDD]_[HHMMSS]__Description.sql`

---

## Testing and debugging

### Quick UI validation

- Sign in with a known GEE account.
- Run a small script that adds a simple layer and prints a message.
- Draw an AOI polygon and confirm it appears in the geometries list and can be used in code.
- Trigger a thumbnail/screenshot capture and confirm the image is returned and displayed.

### Debug the sandbox protocol

- Use browser devtools to inspect `postMessage` events between parent and iframe.
- If a run fails, verify:
  - token exists in `localStorage`,
  - iframe is mounted and sent `IFRAME_READY`,
  - the `EXECUTE` payload includes `code` and `geometries`.

