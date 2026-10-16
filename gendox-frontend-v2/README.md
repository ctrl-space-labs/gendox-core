# gendox-frontend-v2

The redesigned Gendox frontend. It replaces `gendox-frontend` when every page has moved over.

- **Stack**: Next.js (Pages Router, static export), React, Redux Toolkit, JavaScript.
- **Design system**: `src/styles/themes.css` (tokens, dark and light) and `src/styles/base.css` (layout and components). Components use these classes; there is no UI library.
- **Logic**: `src/gendox-sdk`, `src/store`, `src/authentication`, `src/configs`, `src/hooks` and `src/services` are carried over from `gendox-frontend`.

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build
```

It reads the same `NEXT_PUBLIC_*` variables as `gendox-frontend` and uses the same port, so run one of the two at a time.
