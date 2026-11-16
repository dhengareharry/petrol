# Running and building the Oasis Fuel Rewards app

The Expo app talks to the API (a separate repository, **petrol-backend**) through one setting, `EXPO_PUBLIC_API_URL`.
Deploy the API first (see that repository's `DEPLOY.md`) and note its URL: `https://<your-service>.onrender.com/api/v1`.

## Point the app at the backend

The app reads `EXPO_PUBLIC_API_URL` when it is built/started.

**A. Expo Go on an Android phone (quickest)**
1. In the `frontend` folder create/edit `.env.local`:
   ```
   EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com/api/v1
   ```
2. Start Expo clearing the cache, then scan the QR code with **Expo Go** (SDK 58):
   ```bash
   cd frontend
   npx expo start -c
   ```
   The phone only needs internet (not the same Wi-Fi as your PC) because the backend is public.

**B. Installable Android app (APK) with EAS**
1. Put your real URL in `frontend/eas.json` (`build.preview.env.EXPO_PUBLIC_API_URL`; the same value is in the other profiles).
2. Build and install:
   ```bash
   npm install -g eas-cli
   cd frontend
   eas login
   eas build -p android --profile preview
   ```
   EAS prints a link/QR to download the APK. The app icon and splash screen (Oasis Fuel logo) only appear in this build — Expo Go always shows its own.

## Check it end to end
- Staff login: `admin` / `cashier` (passwords come from the backend's seed — change them).
- Customer: tap **Create an account** → **Send OTP** → you get a real SMS (the Fast2SMS wallet needs the ₹100 minimum recharge).
- Watch the API's logs on Render: every request and every OTP/SMS result is logged.

A change to `EXPO_PUBLIC_API_URL` needs a restart of `npx expo start -c` or a new EAS build.
