# Deploying Oasis Fuel Rewards

Backend (Express + Prisma + PostgreSQL) → **Render**. App (Expo) → talks to it through one setting, `EXPO_PUBLIC_API_URL`.

## 1. Deploy the backend on Render

You already have a Render PostgreSQL database. This repo has a Blueprint (`render.yaml`) that creates the web service.

1. Render dashboard → **New → Blueprint** → connect this GitHub repo → pick the `main` branch.
2. Render reads `render.yaml` and asks for two secrets:
   - `DATABASE_URL` → your database's **Internal** URL (dashboard → your PostgreSQL → *Connections* → *Internal Database URL*).
     Use the Internal URL here (same region as the service); the External URL is only for your own PC and needs `?sslmode=require`.
   - `FAST2SMS_API_KEY` → your Fast2SMS key. (Use a *new* key — the old one was pasted in chat.)
3. Click **Apply**. Render builds, runs `prisma migrate deploy` (creates/updates tables), then starts the server.
   `JWT_SECRET` is generated automatically.
4. When it shows **Live**, open `https://<your-service>.onrender.com/api/v1/health` — you should see `{"data":{"status":"ok","database":"up"}}`.
5. **Seed once** (rewards, settings, admin/cashier, demo customers) from your PC, using the *External* database URL:
   ```bash
   cd backend
   npm run db:seed
   ```
   (`backend/.env` → `DATABASE_URL` must be the External URL with `?sslmode=require`.) Skip this if you already seeded.

Your API base URL is `https://<your-service>.onrender.com/api/v1`.

**Costs and limits to know**
- `render.yaml` uses the **Starter** plan because fuel-proof photos need a persistent disk (`/var/data`) — Render's disk is wiped on every deploy otherwise — and pre-deploy migrations need a paid plan.
- On the **Free** plan the service sleeps after 15 minutes idle (the first request then takes ~30–60 s, longer than the app waits) and uploaded photos are lost on each deploy. Fine for a quick demo only: delete the `disk:` block and `preDeployCommand`, and put `npm run db:deploy` at the end of `buildCommand`.
- Render's free PostgreSQL expires after 30 days. Upgrade it before then or you lose the data.

## 2. Point the app at the backend

The app reads `EXPO_PUBLIC_API_URL` when it is built/started.

**A. Expo Go on an Android phone (quickest)**
1. In the repo root create/edit `.env.local`:
   ```
   EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com/api/v1
   ```
2. Start Expo clearing the cache, then scan the QR code with **Expo Go** (SDK 58):
   ```bash
   npx expo start -c
   ```
   The phone only needs internet (not the same Wi-Fi as your PC) because the backend is public.

**B. Installable Android app (APK) with EAS**
1. Put your real URL in `eas.json` (`build.preview.env.EXPO_PUBLIC_API_URL`; the same value is in the other profiles).
2. Build and install:
   ```bash
   npm install -g eas-cli
   eas login
   eas build -p android --profile preview
   ```
   EAS prints a link/QR to download the APK. The app icon and splash screen (Oasis Fuel logo) only appear in this build — Expo Go always shows its own.

## 3. Check it end to end
- Staff login: `admin` / `cashier` (passwords from `SEED_ADMIN_PASSWORD` / `SEED_CASHIER_PASSWORD`, defaults `admin123` / `cashier123` — change them).
- Customer: tap **Create an account** → **Send OTP** → you get a real SMS (Fast2SMS wallet needs the ₹100 minimum recharge).
- Watch **Render → your service → Logs**: every request and every OTP/SMS result is logged.

## Updating later
Push to `main` → Render redeploys automatically (and applies new migrations). A change to `EXPO_PUBLIC_API_URL` needs a restart of `npx expo start -c` or a new EAS build.
