# Oasis Fuel Rewards — app

A fuel-pump loyalty program: customers earn points per litre, upload fuel proofs, and redeem rewards; cashiers and admins run it.

This repository is the **mobile app** (Expo / React Native, also runs on the web), in [`frontend/`](frontend).
The REST API and the PostgreSQL database live in their own repository, **petrol-backend** (`D:\P\petrol-backend` on this machine).

```bash
cd frontend
npm install
npx expo start
```

The app finds the API through `frontend/.env.local`:

```
EXPO_PUBLIC_API_URL=http://<your PC's Wi-Fi IP>:4100/api/v1     # or https://<your-service>.onrender.com/api/v1
```

See [`DEPLOY.md`](DEPLOY.md) for running on a phone and building an APK.
