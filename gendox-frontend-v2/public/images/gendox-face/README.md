# Gendox face assets

Vector reconstructions of the designer's six robot faces, plus expression and
animation examples. These use the **original wide proportions**, not the later
narrower experiments: a 144 × 38 capsule (about 3.8:1), a 3-unit stroke, and a
180 × 90 viewBox. The mouth stays centered beneath the capsule.

## Contents

- `originals/`: the six reference poses, without body tilts.
- `originals-sheet.svg`: the reference faces in their original arrangement.
- `expressions/`: 13 poses, including happy, thinking, wink, and gaze directions.
- `expressions.json`: editable pose and control-point data.
- `gendox-animated.svg`: the full 24-second expression sequence.
- `gendox-loader.svg`: a six-second loop with gaze changes, blinks, and a smile.
- `gendox-loader.gif`: the same loader, white on transparent, 360 × 180 pixels,
  20 frames per second, looping indefinitely. Display at 180 × 90 for a crisp
  result. The capsule's proportions and relative feature sizes match the SVG.
- `example.html`: standalone interactive expression example and loader previews.
  Open directly in a browser, or visit `/images/gendox-face/example.html` when
  the frontend is running. It has no network or library dependencies.

All SVGs have transparent backgrounds and default to white; use them against
a contrasting surface. Change the SVG root's `color="#ffffff"` to recolor every
feature. Inline SVG can inherit CSS `color` after removing that attribute.
An external SVG in an `img` does not inherit the parent element's color.

## Use as a loader

The files are public assets, so no import or JavaScript is needed. Use the SVG
for scalable artwork or the GIF where an animated raster image is required.
For example, in a React component on a contrasting surface:

```jsx
<div role="status">
  <picture>
    <source
      media="(prefers-reduced-motion: reduce)"
      srcSet="/images/gendox-face/expressions/neutral.svg"
    />
    <img
      src="/images/gendox-face/gendox-loader.gif"
      width="180"
      height="90"
      alt=""
    />
  </picture>
  <span>Loading…</span>
</div>
```

Replace the GIF path with `gendox-loader.svg` for the SVG version. No existing
application loader is changed by adding these assets. The standalone example
provides Play/Pause and defaults to a still face for reduced-motion users.

## How the motion works

The expression SVGs are individual static poses. The animation interpolates
matching cubic Bézier paths for the eye curves and mouth, moves the pupils,
and compresses only the eyes vertically for a brief blink. The outline keeps
its original dimensions. The loader returns to its initial pose before the
loop repeats. The GIF is sampled directly from `gendox-loader.svg`.

## Regenerate the GIF

Requires the e2e suite's Playwright with Chromium, and Python 3 with Pillow.
From the repository root:

```sh
# Once, if these tools are not already installed:
npm --prefix gendox-e2e-tests install
cd gendox-e2e-tests && npx playwright install chromium && cd ..
python3 -m pip install Pillow

node gendox-frontend-v2/scripts/render-face-loader.cjs
```

The renderer samples one complete six-second SVG loop at 20 fps. Its temporary
frames are removed after encoding. GIF transparency is binary, so the encoder
uses a white/transparent palette and clears each frame to prevent trails.
