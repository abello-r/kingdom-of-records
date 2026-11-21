# Deploying the game

The game is a static site: `npm run build` writes everything into `dist/` (HTML, JavaScript, the
SQLite WebAssembly file, art, sounds and fonts). There is no server code and no database to host.

- The build uses relative paths (`base: './'` in `vite.config.ts`), so it works at the root of a domain
  or in a sub-folder such as `https://<user>.github.io/<repo>/`.
- Routes use the URL hash (`#/map`, `#/level/easy-2`), so no rewrite or redirect rules are needed.
- Player progress is kept in each player's browser (`localStorage`); nothing is sent anywhere.

**Chosen setup:** a public GitHub repository connected to **Netlify**. Every push to `main` is
tested, built and published automatically. GitHub Pages is documented below as an alternative.

## 1. Put the repository on GitHub

1. On GitHub: **New repository** → name it → **Public** → do **not** add a README, licence or
   `.gitignore` (the project has them) → **Create repository**.
2. In the project folder:

   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

3. Open the **Actions** tab and check that **CI** passes.
4. `REPO_URL` in `src/app/site.ts` holds the repository address
   (https://github.com/abello-r/kingdom-of-records) for the small "star it on GitHub" links: in the
   title-screen footer, in a one-time message after Easy 3 (remembered apart from the progress, so
   starting over does not bring it back) and in the epilogue credits.

The original asset packs at the repository root are excluded by `.gitignore` and are not pushed; the
game only needs the copies in `public/assets/`.

### Checks on every push (CI)

`.github/workflows/ci.yml` runs on every push and pull request: `npm ci`, type check, tests and a
production build. It never publishes anything. The Node.js version for CI and Netlify comes from
`.nvmrc`.

## 2. Connect Netlify (automatic deploys)

1. Sign in at <https://app.netlify.com>.
2. **Add new site** (or **Add new project**) → **Import an existing project** → **GitHub**.
3. Authorise the Netlify app on GitHub. When asked which repositories it may access, choose
   **Only select repositories** and pick this repository.
4. Select the repository. Netlify reads `netlify.toml`, so the settings should already show:
   - Branch to deploy: `main`
   - Build command: `npm test && npm run build`
   - Publish directory: `dist`

   Leave them as they are.
5. Click **Deploy**. The first build takes a minute or two; the site address
   (`https://<random-name>.netlify.app`) appears at the top of the site page.
6. Optional: **Site configuration** → **Change site name** to choose the address, or **Domain
   management** to add a custom domain.

From then on:

- Every push to `main` publishes a new version. If a test or the build fails, nothing is published
  and the previous version stays online.
- Pull requests get a separate *deploy preview* address; they do not change the live site.
- To pause publishing for a while: **Deploys** → **Lock to stop auto publishing** (builds keep
  running; **Publish deploy** puts one live by hand). **Unlock** to go back to automatic.
- To go back to an earlier version: **Deploys** → pick a previous deploy → **Publish deploy**.

`netlify.toml` also adds a few safe response headers (`X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`).

## Suggestions (Netlify Forms)

The "Suggestions" link in the title-screen footer opens a small form (message and an optional email)
that is sent to **Netlify Forms** as the form `suggestions`. `index.html` holds a hidden copy of the
form so Netlify detects it when the site is deployed; a hidden honeypot field (`bot-field`) and
Netlify's own spam filter keep bots out. Forms only work on Netlify, not on GitHub Pages; on a local
copy the form says so.

To receive each suggestion by email:

1. In Netlify, open the site, then **Project configuration** (or **Site configuration**) → **Forms**.
2. If it shows **Enable form detection**, click it, then deploy again (**Deploys** → **Trigger deploy**
   → **Deploy site**) so the form is detected.
3. Still in **Forms**, under **Form notifications**, click **Add notification** → **Email notification**.
4. Event: **New form submission**; Email to notify: your address; Form: **suggestions**. Save.

Submissions are also listed in the site's **Forms** page. The free plan accepts 100 submissions per
month. The email field is optional and only shown to you, to reply.

## Alternative: GitHub Pages

Kept ready in `.github/workflows/deploy-pages.yml`. It has **no automatic trigger**: it runs only
when someone starts it. Free for public repositories.

1. On GitHub: **Settings** → **Pages** → **Build and deployment** → **Source**: **GitHub Actions**.
2. **Actions** tab → **Deploy to GitHub Pages** → **Run workflow** → branch `main` → **Run workflow**.
3. When the run is green, the address (`https://<user>.github.io/<repo>/`) is shown on the run summary
   and in **Settings** → **Pages**.

To take it down: **Settings** → **Pages** → **Unpublish site**.

## Before publishing

- Licences: the art, effects, sounds and fonts used allow use in a published game (see
  [`public/assets/CREDITS.md`](../public/assets/CREDITS.md)). The repository only contains the files the
  game uses, inside the game's source; the original packs are not pushed. The *Super Pixel Effects
  Gigapack* licence does not allow publishing its files apart from a game.
- The game's own code, story and texts: all rights reserved (see `LICENSE`).

## Sharing the link

`index.html` holds the link-preview metadata (Open Graph and Twitter Card): title, description and the
1200x630 image `public/og-image.png` (a capture of the title screen at 1440x756, the narrowest width
with the Ko-fi sign, scaled down). Social sites need absolute URLs,
so the address `https://kingdom-of-records.netlify.app/` is written there; update it if the site moves.

- LinkedIn keeps its own copy of a preview. After changing the image or texts, paste the address into
  https://www.linkedin.com/post-inspector/ to refresh it.
- The favicons (`public/assets/icons/`) are made by `scripts/build_assets.py` from the Tiny Swords
  shield icon.
