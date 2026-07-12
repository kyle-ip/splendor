# Deploy to GitHub Pages

1. Push this repository to GitHub
2. In the repo **Settings → Pages**, set Source to **GitHub Actions**
3. On push to `main` or `master`, [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) builds and deploys automatically
4. Site URL: `https://<username>.github.io/splendor-guide/`

Deep links (e.g. `/tools/solo/dice`) work on refresh because the Vite build copies `index.html` to `404.html` for GitHub Pages SPA fallback.

If the repository name is not `splendor-guide`, update `base` in [`vite.config.ts`](../vite.config.ts) and ensure the router basename matches (`import.meta.env.BASE_URL` in [`src/main.tsx`](../src/main.tsx)).
