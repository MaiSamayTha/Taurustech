# Taurus Tech

Marketing site for Taurus Tech — consulting for IT Ops, AI & Cloud.

A static site with no build step and no dependencies:

| File          | Purpose                                   |
| ------------- | ----------------------------------------- |
| `index.html`  | Page markup and content                   |
| `styles.css`  | All styles, including responsive layouts  |
| `main.js`     | Loader, headline fitting, tabs, clocks    |
| `favicon.svg` | Browser tab icon                          |

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Upload the repository root to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3). There is nothing to build.

For GitHub Pages: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
