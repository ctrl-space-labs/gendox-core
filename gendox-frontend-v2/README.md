# gendox-frontend

The Gendox web app.

- **Stack**: Next.js (Pages Router, static export), React, Redux Toolkit, JavaScript.
- **Design system**: `src/styles/themes.css` (tokens, dark and light) and `src/styles/base.css` (layout and components), with app-only additions in `src/styles/app.css`. Components use these classes; there is no UI library. Icons are `lucide-react`.
- **Layout**: `src/components` holds the screens' parts by area (`agent`, `chat`, `knowledge`, `tasks`, `earth-observation`, …) and the small UI kit in `src/components/ui`. `src/views` holds the screens that open both as a page and as a window in the dock (`src/components/dock`).
- **Logic**: `src/gendox-sdk` (one service per API area), `src/store` (Redux Toolkit slices), `src/authentication` (OIDC with Keycloak, the organization and project guard).

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build        # static export into out/
```

Configuration is the `NEXT_PUBLIC_*` variables in `.env.*`; the Docker image takes them as build args.
