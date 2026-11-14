# Roof skeleton demo
Straight skeleton of a drawn polygon (2D plan + three.js roof). Vite + TypeScript + Vitest + Open Props.

```
npm install
npm run dev        # dev server; ?preset=L&mode=nearest picks preset and mode
npm test           # vitest: skeleton (area sum, simple faces, node height = distance to face planes, 300 random polygons) and nearest-segment checks
npm run typecheck
npm run build      # tsc --noEmit && vite build -> dist/
npm run preview
```

Core algorithm in `src/geometry/skeleton.ts`.

## Deployment
Pushes to `main` build and deploy `dist/` to GitHub Pages via `.github/workflows/deploy.yml`.
In the repo settings, set **Pages > Source** to **GitHub Actions**. The site is served under `/roof-simulator/` (`base` in `vite.config.ts`).
