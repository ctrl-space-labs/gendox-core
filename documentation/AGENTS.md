# AGENTS.md: documentation

Guidance for coding agents working on the Docusaurus site in this folder. The site is **public** and written mainly for end users.

## Screenshots, GIFs and videos

Images live next to the pages, in `docs/<section>/img/v2/`. Embed a GIF with an import:

```mdx
import demo from './img/v2/my-demo.gif';

<img src={demo} alt="What the GIF shows" width="100%" />
```

Two ways to capture, depending on where the content is:

**1. A demo organization with real content, in the maintainer's own Chrome (Claude in Chrome).**
Use it for chats, task results and settings that need real answers.
- Screenshots: `computer` → `screenshot` with `save_to_disk`, then copy the saved file into `img/v2/`.
- GIFs: `gif_creator` → `start_recording`, take one screenshot per step (a frame is captured on every action and screenshot, so it plays as a slideshow of about one frame per second), `stop_recording`, then `export` with `download: true` and `options: { showWatermark: false, showProgressBar: false }`. Keep the click indicators and action labels: they show what was clicked.
- Window: a 1280–1600 px wide viewport. Some settings pages break below about 1440 px.
- Chat messages are fine. **Never start a task run (generate, digitize) without asking**: it uses credits.

**2. The local [ephemeral environment](../gendox-compose-scripts/ephemeral/README.md), with Playwright.**
Use it for first-run flows (sign-in, creating an organization and agent, uploads) and for organization pages, where only test data should appear.
- Sign in once and save the session (`storageState`), then record in a second context with `recordVideo: { size: { width: 1280, height: 800 } }`, so the video starts after the sign-in page.
- Type with `pressSequentially(text, { delay: 60 })` and pause between steps, so viewers can follow.
- A seeded user that belongs to no organization sees the first-run screens. Once it has created an organization, that path is used up until the environment is rebuilt.
- Mock models answer `MOCK GEMINI RESPONSE…`: don't capture their answers.

**Convert a video (or shrink a GIF) with ffmpeg:**

```bash
ffmpeg -i in.webm -vf "fps=8,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 out.gif
```

Use `fps=8` for videos and `fps=2` for slideshow GIFs from Chrome, and a width of 960–1024. Aim for a few MB at most per GIF.

## Before publishing any image

The site is public. Check every frame:

- **Mask people.** Replace the signed-in user's name, initials and email in the DOM before capturing (a small script with a `MutationObserver` keeps it replaced while the page changes). Use a neutral name such as *Alex Morgan* and `alex@example.com`.
- **Hide other organizations** in the account menu, other members' names and emails, and any API key or provider key, even partly masked.
- **Hide prices and plan limits** (plan pages, allowance counters). Describe them in words instead.
- Prefer content that is public or invented: sample invoices, public documents, the Gendox docs themselves.
- After capturing, extract a frame or crop of each GIF (`ffmpeg -ss 5 -i x.gif -frames:v 1 x.png`) and check it.

## Writing for humans and AI agents

- Every page has front matter with `title` and a one-line `description`.
- Use the exact UI names in **bold** and write navigation as **Place → Button**.
- Prefer steps and tables over prose. Add new pages to `static/llms.txt`.
- `npm run build` must pass: broken links fail the build.
