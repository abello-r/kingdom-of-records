# Deploying the game

The game is a static site: `npm run build` writes everything into `dist/` (HTML, JavaScript, the
SQLite WebAssembly file, art, sounds and fonts). There is no server code and no database to host.

- The build uses relative paths (`base: './'` in `vite.config.ts`), so it works at the root of a domain
  or in a sub-folder such as `https://<user>.github.io/<repo>/`.
- Routes use the URL hash (`#/map`, `#/level/easy-2`), so no rewrite or redirect rules are needed.
- Player progress is kept in each player's browser (`localStorage`); nothing is sent anywhere.

Two hosts are prepared. Pick one.

| | GitHub Pages | Netlify |
|---|---|---|
| Config in this repo | `.github/workflows/deploy-pages.yml` | `netlify.toml` |
| Publishing | Only when the workflow is run by hand | Manual upload, or automatic on push if the repo is connected (can be locked) |
| Private repository | Needs a paid GitHub plan (Pro, Team or Enterprise) | Works on the free plan |
| Address | `https://<user>.github.io/<repo>/` | `https://<site-name>.netlify.app` (custom domain possible) |

Either way, **the published site is public**: anyone with the address can play it and download its
files, even if the repository is private.

## Checks on every push (CI)

`.github/workflows/ci.yml` runs on every push and pull request once the repository is on GitHub:
`npm ci`, type check, tests and a production build. It never publishes anything.

The Node.js version for CI and Netlify comes from `.nvmrc`.

## Option A — GitHub Pages

The deploy workflow has **no automatic trigger**: it runs only when someone starts it.

1. Push the repository to GitHub (see [First push](#first-push) below).
2. On GitHub, open the repository → **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, choose **GitHub Actions**.
4. Open the **Actions** tab → **Deploy to GitHub Pages** (left column) → **Run workflow** → choose the
   `main` branch → **Run workflow**.
5. When the run is green, the address is shown on the run summary and in **Settings** → **Pages**.

To publish a new version later, repeat step 4.

To take the site down: **Settings** → **Pages** → **Unpublish site** (or delete the `github-pages`
environment).

## Option B — Netlify

### B1. Manual upload (nothing connected, nothing automatic)

1. Build locally: `npm ci` then `npm run build`.
2. Go to <https://app.netlify.com/drop> (sign in) and drag the `dist` folder onto the page.
3. Netlify gives the site an address; rename it in **Site configuration** → **Change site name**.

To publish a new version: **Deploys** → drag the new `dist` folder onto the deploy area.

The same can be done from a terminal with the Netlify CLI:

```bash
npx netlify-cli login
npx netlify-cli deploy --dir dist          # draft URL to check first
npx netlify-cli deploy --dir dist --prod   # publish
```

### B2. Connected to the Git repository

1. In Netlify: **Add new site** → **Import an existing project** → choose the Git provider and the
   repository.
2. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`. Keep them.
3. **Before the first deploy** (if publishing must stay manual): after the site is created go to
   **Deploys** → **Lock to stop auto publishing**. Builds still run on each push, but a build is only
   published when someone clicks **Publish deploy**.

`netlify.toml` also adds a few safe response headers (`X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`).

## First push

The repository has no remote yet. To put it on GitHub (private):

1. On GitHub: **New repository** → name it → **Private** → do **not** add a README, licence or
   `.gitignore` (the project has them) → **Create repository**.
2. In the project folder:

   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

3. Open the **Actions** tab and check that **CI** passes.

The original asset packs at the repository root are excluded by `.gitignore` and are not pushed; the
game only needs the copies in `public/assets/`.

## Before publishing

- Licences: the art, effects, sounds and fonts used allow use in a published game (see
  [`public/assets/CREDITS.md`](../public/assets/CREDITS.md)). The *Super Pixel Effects Gigapack* licence
  asks that its files are not redistributed on their own; on a website they are served as part of the
  game, like in any web game.
- The licence for the project's own code and texts is not chosen yet (see the README).
- Sound files are Ogg Vorbis. Browsers that cannot play them (some older Safari versions) run the
  game without sound.
