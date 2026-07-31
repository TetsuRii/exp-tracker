# Expiration Tracker — Deploy Guide (Read This, It's Short)

## The one thing that was wrong
Your site at **exp-tracker.onrender.com** was still running an OLD, different app
("Expenses Tracker"). The new code was in GitHub but never actually deployed to Render —
so sign-in/register failed on any device that didn't have old saved data.

After this guide, Render will run the new app (MongoDB, login/register, 3 stores,
suggestions from the full 14,000-product list, barcode, backups).

---

## Step 1 — Upload these files to GitHub (repo root, same names, same folders)

In your repo **github.com/TetsuRii/exp-tracker** (branch `main`), make sure ALL of these
are at the root (use "Add file → Upload files" and drag them in):

| File | What it is |
|---|---|
| `raw.js` | The server (UPDATED — upload this new version) |
| `ai-widget.js` | Search bar / scanner / chat / import (UPDATED — upload this new version) |
| `ai-categorizer.js` | Category guessing (already in repo, keep it) |
| `index.html` | The page (already in repo, keep it) |
| `build.sh` | Build script — must contain `npm install` (already in repo, keep it) |
| `package.json` | Dependencies (already in repo, keep it) |
| `package-lock.json` | NEW — upload it (makes installs reliable) |
| `all_products.json` | NEW — your 14,046-product list (makes suggestions work) |
| `favicon.svg` | Icon (already in repo, keep it) |
| `assets/` folder | Contains `index-CYG6-Z0O.js` and `index-Dnyki7yl.css` (already in repo, keep it) |

Wait for the push to finish ("your branch is up to date").

## Step 2 — Render settings (Dashboard → your exp-tracker service → Settings)

Scroll to **Build & Deploy** and confirm these are EXACT:

- **Root Directory:** leave BLANK (or `/`)
- **Build Command:** `bash build.sh`
- **Start Command:** `node raw.js`

If any of those are different, fix them and save.

## Step 3 — Environment variables (Dashboard → Environment)

Add ALL of these:

| Key | Value |
|---|---|
| `MONGODB_URI` | `mongodb+srv://TariqBethel:Crispy17%23@exp-tracker.bmcgc3j.mongodb.net/?appName=exp-tracker` |
| `JWT_SECRET` | any long random text, e.g. `make-up-your-own-secret-123` |
| `BACKUP_EMAIL` | the Gmail address where backups should arrive |
| `EMAIL_USER` | your Gmail address (the sender) |
| `EMAIL_PASS` | your Gmail App Password |

⚠️ `MONGODB_URI` — the `#` in the password MUST be written as `%23` (that's the only way
it works). There must be NO `<db_username>` placeholders left in it.

Also confirm in **MongoDB Atlas → Network Access** that `0.0.0.0/0` is allowed (anywhere).

## Step 4 — Deploy it

Dashboard → your service → **Manual Deploy → Deploy latest commit** (or if you just pushed,
wait for auto-deploy). Watch the **Logs** tab:

- You should see: `npm install` running, then `✅ Connected to MongoDB Atlas`,
  `🌐 Global suggestion pool built: 14011 products`, and `✓ Server on http://localhost:10000`.
- If instead you see a red error, paste it here and I'll fix it.

## Step 5 — Use it

1. Open **https://exp-tracker.onrender.com** (wait up to ~60s on first load — free tier wakes up).
2. **Register an account** (any username + password). The old app's data was on a
   temporary hard drive that Render wipes — it's gone. New data saves to MongoDB
   permanently.
3. **All accounts share ONE dataset.** Log in with any account on any device and you
   see the same products, history, and suggestions. Edits made on one account show up
   on every other account. (Logins are separate, data is shared.)
4. Add products → the suggestion dropdown searches ALL 14,000+ products.
5. **Search bar** — on the **Tracker** tab there's a search bar at the top that
   filters the table as you type (shows "X of Y match"), clears with **Esc**, hides
   when you open Add/Edit or switch tabs, and scrolls away naturally.
6. To import your Excel CSV: click the 🤖 button → **📥 Import Products** → choose the CSV file.

---

## If it still fails
Paste me these three things:
1. Render **Logs** (the last ~30 lines)
2. What you see in the browser (error text exactly)
3. What `MONGODB_URI` shows in Render Environment (password hidden is fine)

Don't guess — paste and I'll point at the exact line.
