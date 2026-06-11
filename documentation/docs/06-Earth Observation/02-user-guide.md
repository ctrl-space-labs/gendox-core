---
sidebar_position: 2
title: User Guide
---

import demoVideo from './img/SeaScope-quick-demo-720p.mp4';

# SeaScope User Guide

SeaScope is an Earth Observation workspace with three panels:

- **Map**: interactive map with analysis layers and AOIs.
- **Editor**: Google Earth Engine (GEE) JavaScript code.
- **Chat**: an AI agent that can propose and apply code changes.

## Quick demo

<video controls autoPlay muted playsInline width="100%">
  <source src={demoVideo} type="video/mp4" />
  Your browser does not support the video tag.
</video>

---

## 1) Sign in with Google Earth Engine (GEE)

When you open the workspace, SeaScope prompts you to authenticate with Google so it can run GEE scripts **in your browser**.

- **First-time sign-in**: click **Sign in with Google** and complete the OAuth flow.
- **Session expired**: you’ll see a banner with **Reconnect**. Click it to re-authenticate.

**Where your token lives:** SeaScope stores the GEE access token in your browser’s `localStorage` (per-browser, per-profile). It is used only to run scripts and fetch map tiles.

---

## 2) Understand the workspace layout

SeaScope uses a 3-panel layout:

- **Map panel (left)**: base map + result layers + AOI tools.
- **Editor panel (top-right)**: your current GEE script.
- **Chat panel (bottom-right)**: conversation with the agent.

You can:

- **Resize panels** via splitters.
- **Maximize/minimize** a panel using panel controls.
- Switch between layout modes without losing editor/map state (panels stay mounted).

---

## 3) Ask the agent a question

Use the chat to describe the outcome you want, for example:

- “Detect recent burned areas inside my AOI and visualize them as a red mask.”
- “Compute NDVI change between last month and this month, clipped to the polygon.”
- “Highlight water extent and add a legend-friendly palette.”

The agent can use workspace context such as:

- **Current script content** (the code in the editor).
- **Your drawn AOIs** (geometries).
- **Script logs** (what the script printed during execution).

---

## 4) Review and accept code edits

When the agent proposes changes, SeaScope can apply them directly to the editor as a patch.

Typical workflow:

1. Read the agent’s explanation.
2. Review the patch in the editor.
3. **Accept** changes (or adjust them manually).

If you prefer fast iteration, enable “keep all” / auto-accept behavior (when available) so patches apply without repeated confirmations.

---

## 5) Run code and interpret results

Click **Run Code** in the editor panel.

What happens on run:

- SeaScope executes the script in a **sandboxed hidden iframe** (browser-only runtime).
- Your **GEE token** and **current geometries** are passed to the sandbox.
- The sandbox returns:
  - **Map layers** (GEE tile URLs) that are rendered on the map.
  - **Print logs** (to help you debug and validate output).
  - **Errors** (syntax/runtime) if the script fails.
  - **Export operations** (if the script starts exports).

If you see an error:

- Fix the code (manually or by asking the agent to correct it).
- Run again.

---

## 6) Read map results (layers)

SeaScope overlays GEE result layers on top of a standard base map.

Common actions:

- **Toggle layers** on/off to compare outputs.
- **Zoom** and **pan** to inspect local detail.
- Use any **“zoom to” / “center”** actions triggered by the script or tools.

---

## 7) Draw Areas of Interest (AOIs)

Use the map drawing tools to define the area you want to analyze:

- **Polygon**: trace an arbitrary region.
- **Rectangle**: quick bounding box.
- **Point**: single location.

After drawing:

- **Name the geometry** so you can reference it consistently in conversation.
- Geometries are saved to the task and can be reused later.

How geometries appear in scripts:

- The runtime provides a `geometries` array (`geometries[0]`, `geometries[1]`, …).
- The agent can write code that uses the “first geometry” or a specific AOI.

---

## 8) Take screenshots and iterate with visuals

SeaScope can capture map thumbnails/screenshots so you can share visual evidence with the agent:

- Take a screenshot from the map panel.
- Paste it into the chat and say what you want to change (e.g., “too noisy”, “focus only inside the polygon”, “use a different palette”, “reduce false positives”).

This is the fastest way to steer the agent toward the right visualization and thresholds.

---

## 9) Script versions

SeaScope stores scripts as versions for the current task:

- **After a successful run**, the current script is saved as a new version (unless unchanged).
- You can browse or switch between versions to compare approaches.

Tip: Name scripts clearly (“BurnedArea_v2”, “NDVIChange_AOI1”) so it’s easy to navigate history.

---

## 10) Export operations (optional)

Some analyses trigger long-running exports (e.g., exporting a raster result).

In SeaScope you can:

- See export operations appear in the map panel.
- Monitor their status as they progress.
- Cancel an export if it’s no longer needed.

---

## Troubleshooting

- **Reconnect banner keeps appearing**: authenticate again; ensure your browser is not blocking third-party cookies/popups required by OAuth.
- **No layers appear**: check the script prints/errors; verify the code adds layers and the AOI is valid.
- **Slow performance**: simplify AOIs, reduce resolution/scale, and avoid heavy per-pixel operations unless necessary.

