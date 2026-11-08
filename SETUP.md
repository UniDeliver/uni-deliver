# Uni Deliver: Local Setup

How to run the **backend API**, **admin website** and **mobile app** on your own computer.

> Last verified: 2026-11-08 on macOS with Node 25.6, npm 11.9 and MongoDB Community 7.0, using an Android phone running Expo Go.
> If a step here doesn't work for you, fix this file in the same PR, and note it in the [PROGRESS.md change log](PROGRESS.md#change-log).

---

## 1. What runs where

```
unideliver/
├── backend/          Express + TypeScript API          → http://localhost:4000
├── admin/            Next.js admin website             → http://localhost:3000
├── mobile/           Expo app (customer + rider)       → Expo Go on your phone
└── packages/shared/  Enums, types and zod schemas used by all three
```

There is **no root `package.json`**: each folder installs its own dependencies.
`@unideliver/shared` is not published to npm. Each app reads it straight from `packages/shared/src`
through TypeScript path aliases (and Metro config for mobile), so you never need to build it during development.

---

## 2. Prerequisites

| Tool | Version | Check | Notes |
| --- | --- | --- | --- |
| Node.js | 20.19 or newer (LTS recommended) | `node -v` | Expo SDK 57 and Next.js 16 need a modern Node |
| npm | 10+ | `npm -v` | Comes with Node |
| Git | any | `git --version` | |
| MongoDB | 7.x locally, **or** a MongoDB Atlas cluster | `mongosh --version` | Local is easiest for development |
| Expo Go | Latest from the Play Store | | On an Android phone (Android 8.0+) |

Your phone and your computer **must be on the same Wi-Fi network**. Campus or guest networks that
block device-to-device traffic will not work; use a phone hotspot instead.

### Installing MongoDB locally

**macOS (Homebrew)**

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Windows:** install *MongoDB Community Server 7* from mongodb.com and tick "Install as a service".

**Linux:** follow the official guide for your distribution.

**Check it works:**

```bash
mongosh --quiet --eval 'db.runCommand({ ping: 1 }).ok'    # prints 1
```

> **Mac: if `brew services start` fails or MongoDB keeps stopping**, run it in the foreground in its own terminal:
> `mongod --config /opt/homebrew/etc/mongod.conf` (Intel Macs: `/usr/local/etc/mongod.conf`).
> Check the log at `/opt/homebrew/var/log/mongodb/mongo.log`. **"No space left on device" means your disk is full.**
> MongoDB needs a few GB free.

**Using Atlas instead:** create a free cluster, add your IP under *Network Access*, and put the connection
string in `MONGODB_URI` (step 4).

---

## 3. Get the code and install dependencies

```bash
git clone https://github.com/UniDeliver/uni-deliver.git
cd uni-deliver
git checkout develop             # day-to-day work happens on develop (see branching below)

# Install each part (order doesn't matter)
cd packages/shared && npm install && cd ../..
cd backend         && npm install && cd ..
cd admin           && npm install && cd ..
cd mobile          && npm install && cd ..
```

### Branching

| Branch | Purpose |
| --- | --- |
| `main` | Stable, release-ready code. Only updated by merging `develop` for a release. |
| `develop` | Integration branch. Every feature branch starts here and merges back here. |
| `feature/<TASK-ID>-<short-name>` | Your work for one task, e.g. `feature/SAR-3-profiles`, `feature/UTH-2-cart`. |

```bash
git checkout develop
git pull
git checkout -b feature/SAR-3-profiles
# ...commit your work...
git push -u origin feature/SAR-3-profiles
```

Open a pull request **into `develop`** (not `main`) and ask your partner to review it. Don't approve your own PR.

---

## 4. Environment variables

Env files are **git-ignored**. Never commit real secrets. Every variable below has a safe development
default, so **the backend runs with no `.env` at all** against a local MongoDB.

### `backend/.env` (optional in development)

```dotenv
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/unideliver_dev

# Signs mobile session tokens. Optional in development (a dev-only default is used);
# REQUIRED in production. Use a long random string, e.g. `openssl rand -hex 32`.
JWT_SECRET=

# Comma-separated browser origins allowed to call the API (the admin site).
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006

# Firebase Admin (only needed for real admin sign-in; leave empty in development)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Allows `dev:` bypass tokens. They are accepted automatically when NODE_ENV=development.
DEV_AUTH_BYPASS=false
```

### `admin/.env.local` (optional)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### `mobile/.env` (optional, usually leave it out)

In development the app **finds your computer's IP automatically** from the Metro server, so you don't
need this file. Set it only to point the app at a different backend, for example a deployed one:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api/v1
```

> Don't put `localhost` here: on a phone, `localhost` is the phone itself.

---

## 5. Seed the admin account

With MongoDB running:

```bash
cd backend
npm run seed:admin
```

This creates (or updates) an admin user:

| Field | Default | Override with env var |
| --- | --- | --- |
| Email | `admin@unideliver.lk` | `ADMIN_EMAIL` |
| Phone | `+94770000001` | `ADMIN_PHONE` |
| Name | `System Administrator` | `ADMIN_NAME` |
| Password | `AdminPass123!` | `ADMIN_PASSWORD` |

There is no catalogue or demo-data seeder yet (planned under DIL-2).

---

## 6. Run everything

Use **three terminals** (four if you run MongoDB in the foreground).

### Terminal 1: Backend API

```bash
cd backend
npm run dev
```

Expected output:

```
[Database] MongoDB connected: 127.0.0.1
[Server] UniDeliver API running on port 4000 in development mode
```

Check it: `curl http://localhost:4000/health` should return `{"status":"ok",...}`.

The `[Firebase] Warning: Firebase Admin credentials not found` line is normal in development.

### Terminal 2: Admin website

```bash
cd admin
npm run dev
```

Open <http://localhost:3000> and sign in with the seeded admin email.

> ⚠️ **Development only:** the admin login currently sends a development token and **does not check the
> password** (see PROGRESS.md issue #2). This works only while the backend runs with `NODE_ENV=development`.

### Terminal 3: Mobile app

```bash
cd mobile
npx expo start
```

1. Open **Expo Go** on your Android phone.
2. Scan the QR code shown in the terminal.
3. The first load takes a minute while Metro bundles the app.

Useful keys in the Expo terminal: `r` reload · `m` dev menu · `j` debugger · `shift+c` clear cache and restart.

**Using an Android emulator instead of a phone:** start the emulator from Android Studio, then press `a`
in the Expo terminal. The API address is resolved automatically there too.

---

## 7. Try it out

| What | How |
| --- | --- |
| **Customer account** | In the app: *Get started* → fill in the form → you land on the customer home tab. |
| **Login** | *I already have an account* → email **or** phone (`+947XXXXXXXX`) + password. |
| **Forgot password** | Request a code. **No SMS or email provider is configured yet**, so the 6-digit code is printed in the **backend terminal**: `[AuthService] Password reset code for <id>: 123456`. |
| **Rider account** | Riders can't sign up themselves. Create one through the admin API (no admin UI yet): |

```bash
curl -X POST http://localhost:4000/api/v1/admin/riders \
  -H "Authorization: Bearer dev:admin-uid:+94770000001:admin" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Rider","phone":"+94771112233","vehicleNo":"BAA-1234","password":"RiderPass123!"}'
```

Then log in on the phone with `+94771112233` / `RiderPass123!`; you'll land on the rider tab.

**Suspend an account** (the app then shows the "account suspended" screen):

```bash
curl -X PATCH http://localhost:4000/api/v1/admin/users/<userId>/status \
  -H "Authorization: Bearer dev:admin-uid:+94770000001:admin" \
  -H "Content-Type: application/json" \
  -d '{"status":"suspended"}'
```

Get user ids with `GET /api/v1/admin/users` using the same header.

---

## 8. Checks before you push

```bash
# Backend: type-check and run the auth tests
cd backend
npx tsc --noEmit -p .
npx tsx src/test/auth.unit.test.ts

# Admin: type-check and lint
cd ../admin
npx tsc --noEmit -p .
npm run lint

# Mobile: type-check and lint
cd ../mobile
npx tsc --noEmit -p .
npm run lint
```

> `npm test` in `backend/` is not wired to a test runner yet (PROGRESS.md issue #6). Use the `tsx` command above.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| App shows **"Can't reach Uni Deliver right now"** | Backend not running, phone on a different network, or firewall blocking port 4000 | Check `curl http://<your-computer-ip>:4000/health` from the computer, then open that URL in the **phone's browser**. If the phone can't open it, check Wi-Fi or the firewall (macOS: System Settings → Network → Firewall; allow Node). |
| Backend exits with `MongoDB connection error ... ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running | Start it (section 2). On a Mac, if the service won't start, run `mongod --config ...` in a terminal and read its log. |
| Red screen: **Unable to resolve module ...** right after installing a package | Metro bundled before the install finished, or cached an old result | Wait for `npm install` to finish, then `npx expo start -c` to clear the cache. |
| Expo Go says the project needs a newer or older SDK | Expo Go version doesn't match SDK 57 | Update Expo Go from the Play Store. |
| `Invalid environment variables` on backend start | A value in `backend/.env` has the wrong format (for example `JWT_SECRET` shorter than 16 characters) | Fix or remove that line. |
| Admin shows **"Access denied: Administrator privileges required"** | The signed-in account isn't an admin | Run `npm run seed:admin` again. |
| Port 4000 or 3000 already in use | Another process is on that port | `lsof -i :4000` (macOS/Linux) to find it, or set `PORT` in `backend/.env` (then update the admin and mobile URLs). |
| A floating gear button on the phone screen | Expo's developer-tools button (development only) | Ignore it, or turn it off from the Expo dev menu. It's never in release builds. |

---

## 10. Useful references

- [`architecture.md`](architecture.md): data models, endpoints, order lifecycle, security rules
- [`PROGRESS.md`](PROGRESS.md): what's done, what's next, who owns it
- API base path: `http://localhost:4000/api/v1`; current endpoints are listed in PROGRESS.md under *Backend*
