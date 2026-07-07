# Deploying AquaSense AI (free, on Vercel)

AquaSense is a Next.js 14 app with **no backend** (no API routes, no server-side
rendering, no secrets). It deploys free on Vercel — auto-detected, zero config.

---

## Step 1 — Create the GitHub repository (you, ~30 seconds)

1. Go to **https://github.com/new**
2. **Owner:** `rahulrajalwal`
3. **Repository name:** `aquasense`  ← must be exactly this
   (the in-app dataset update-checker fetches
   `raw.githubusercontent.com/rahulrajalwal/aquasense/main/public/data-manifest.json`)
4. **Visibility:** **Public** — required so the update-checker's raw fetch works
5. **Do NOT** tick "Add a README", ".gitignore", or "license" — the repo must be
   **empty**, otherwise the first push is rejected.
6. Click **Create repository**.

## Step 2 — Push the code

The repo is already committed locally on branch `main`, with the remote set to
`https://github.com/rahulrajalwal/aquasense.git`. From the `aquasense/` folder:

```bash
git push -u origin main
```

Authentication uses the GitHub credential already cached on this machine.
(If it prompts, sign in as `rahulrajalwal`.)

## Step 3 — Deploy on Vercel (you, ~1 minute)

1. Go to **https://vercel.com** and **sign in with GitHub**.
2. **Add New… → Project**.
3. **Import** the `aquasense` repository.
4. Vercel auto-detects **Next.js** — leave every setting at its default
   (build command `next build`, output handled automatically). No environment
   variables are needed.
5. Click **Deploy**.

In ~1–2 minutes you get a live URL like `https://aquasense.vercel.app`.

---

## After deployment

- **Auto-deploy:** every `git push` to `main` triggers a new Vercel build and
  redeploys automatically.
- **Update-checker:** the in-app banner/status compares the deployed
  `public/data-manifest.json` against the bundled version. Bump
  `datasetVersion` in both `public/data-manifest.json` and
  `src/lib/data/manifest.ts` when you publish newer official data, and pushing
  it will notify existing users.
- **Custom domain (optional, free):** Vercel → Project → Settings → Domains.

## Alternative — deploy without GitHub (Vercel CLI)

If you ever want to deploy straight from your machine without a repo:

```bash
npm i -g vercel
vercel        # first run logs you in and links the project
vercel --prod # production deploy
```

Note: the GitHub route is preferred here because the update-checker needs the
public repo anyway.
