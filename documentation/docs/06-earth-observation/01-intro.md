---
sidebar_position: 1
title: SeaScope (Earth Observation)
---

import introGraphic from './img/SeaScope-graphic-intro-horizontal.png';

# SeaScope (Earth Observation)

<img src={introGraphic} alt="SeaScope workspace: map, editor, and AI chat panels" width="100%" />

SeaScope is Gendox’s **Earth Observation workspace**: a fast loop where you ask a question, an AI agent produces a Google Earth Engine (GEE) script, the script runs in a secure browser sandbox, and the results appear immediately on the map.

It’s designed for **iterative geospatial analysis**: you can refine the question, narrow an Area of Interest (AOI), compare results, and repeat until you get a trustworthy signal.

---

## What you can do with SeaScope

- **Ask natural-language questions** about satellite-derived signals and changes.
- **Let the agent write analysis code** (GEE JavaScript) based on your intent and context.
- **Run code and visualize results** as layers on an interactive map.
- **Draw AOIs** (polygons/points/rectangles) and use them as inputs to the analysis.
- **Share evidence** by taking map screenshots and continuing the conversation with visuals.

---

## Example use cases

- **Change detection**: shoreline, vegetation, land cover, burned area.
- **Environmental monitoring**: water quality proxies, flooding extent, drought indicators.
- **Incident response**: quickly narrow down a region and iterate on detection heuristics.

---

## Prerequisites

- **A Google Earth Engine account** you can authenticate with (OAuth).
- **A Gendox project and task** created for Earth Observation (SeaScope).
- **A configured agent** for your project (model + tools) to support code editing.

---

## Next

Continue with the [User Guide](./02-user-guide.md) to learn how to sign in, use the 3-panel workspace, run scripts, draw AOIs, and iterate with the agent.

