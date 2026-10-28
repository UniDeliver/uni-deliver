# Uni Deliver

A mobile-based food ordering and delivery support system for students and community members in **Pambahinna and the surrounding Balangoda area**, Sri Lanka.

Uni Deliver digitizes an existing WhatsApp-based community delivery service. Customers order food from outlets such as Pizza Hut, KFC and local eateries. The service provider buys the food on their behalf and delivers it, and customers pay **cash on delivery** (food cost plus delivery fee).

> **Course project:** IS5109 – IS Project for Community, Group 07
> Department of Computing & Information Systems, Faculty of Computing, Sabaragamuwa University of Sri Lanka
> **Community partner:** Uni Delivery (Mr. H. T. M. Bhashitha, Balangoda)
> **Internal supervisor:** Mr. PGP Kumara

---

## Features

### Mobile app (one app for customers and delivery agents)

The app reads the user's **role from the auth response** and opens the matching interface.

**Customer**

- Sign up and log in with phone OTP
- Browse food outlets and menus, with search and filters
- Cart with a clear cost breakdown (food cost + delivery fee)
- Place orders (cash on delivery) with saved addresses and delivery instructions (hostel, building, room)
- Track order status in real time, with push notifications
- Cancel orders within the allowed time window
- View order and payment history; send feedback

**Delivery agent (rider)**

- View available orders; accept or reject them
- Update delivery progress: Preparing → Picked Up → Out for Delivery → Delivered
- Record cash collected on delivery
- View delivery history and earnings

### Admin web dashboard

- Live view of all orders; assign or reassign riders
- Manage outlets, menus and item availability
- Manage customers and riders (create riders, suspend accounts)
- Configure delivery zones and fees, the cancellation window and service hours
- Reports: daily orders, revenue and rider performance
- Handle complaints and feedback

---

## Tech Stack

| Layer              | Technology                                                           |
| ------------------ | -------------------------------------------------------------------- |
| Mobile app         | React Native, Expo, Expo Router, TypeScript, TanStack Query, Zustand |
| Admin dashboard    | Next.js (App Router), TypeScript, Tailwind CSS                       |
| Backend API        | Node.js, Express, TypeScript, Socket.IO                              |
| Database           | MongoDB Atlas (Mongoose)                                             |
| Authentication     | Firebase Authentication (phone OTP, email/password for admin)        |
| Push notifications | Firebase Cloud Messaging via Expo Notifications                      |
| Validation         | zod (shared between all apps)                                        |
| Hosting            | Render (API), Vercel (admin), EAS (mobile builds), MongoDB Atlas     |

---

## Repository Structure

```
uni-deliver/
├── apps/
│   ├── mobile/      # Expo app: customer + rider (role-based navigation)
│   ├── admin/       # Next.js admin dashboard
│   └── api/         # Express REST API + Socket.IO
├── packages/
│   └── shared/      # Shared enums, types and zod schemas
└── docs/
    └── architecture.md
```

See **[docs/architecture.md](docs/architecture.md)** for the full system design, covering data models, API endpoints, the order state machine, security and coding conventions.

---

## Getting Started

### Prerequisites

- Node.js 20 LTS or later, and npm (or pnpm)
- Git
- A MongoDB Atlas cluster (the free tier is fine)
- A Firebase project with **Phone** and **Email/Password** sign-in enabled
- An Expo account and the EAS CLI: `npm install -g eas-cli`
- An Android device or emulator (Android 8.0+)

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/uni-deliver.git
cd uni-deliver
npm install
```

### 2. Configure environment variables

Create the env files listed below. The full list of variables is in `docs/architecture.md` §14.

**`apps/api/.env`**

```
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/unideliver_dev
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CORS_ORIGINS=http://localhost:3000
```

**`apps/mobile/.env`**

```
EXPO_PUBLIC_API_URL=http://<your-local-ip>:4000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://<your-local-ip>:4000
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

**`apps/admin/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

> Use your computer's LAN IP address, not `localhost`, in the mobile env file so a physical phone can reach the API. Place `google-services.json` from Firebase in `apps/mobile/`.

### 3. Seed initial data

```bash
npm run seed:admin --workspace=apps/api      # creates the admin account
npm run seed:demo  --workspace=apps/api      # optional: sample outlets, menus, zones
```

### 4. Run the apps

```bash
# Backend API (http://localhost:4000)
npm run dev --workspace=apps/api

# Admin dashboard (http://localhost:3000)
npm run dev --workspace=apps/admin

# Mobile app
cd apps/mobile
npx expo prebuild          # first time only
npx expo run:android       # or: eas build --profile development --platform android
```

> Phone OTP uses `@react-native-firebase/auth`, so the mobile app needs a **development build**. It will not work in Expo Go.

---

## User Roles

| Role       | App           | How the account is created                                                                    |
| ---------- | ------------- | --------------------------------------------------------------------------------------------- |
| `customer` | Mobile        | Self-registration with phone OTP                                                              |
| `rider`    | Mobile        | Admin pre-creates the rider's phone number in the dashboard; the rider then signs in with OTP |
| `admin`    | Web dashboard | Seed script only                                                                              |

After login, the mobile app calls `GET /api/v1/auth/me` and opens:

- `role: customer` → customer screens
- `role: rider` → rider screens
- `role: admin` → a "please use the web dashboard" screen

---

## Order Lifecycle

```
pending → accepted → preparing → picked_up → out_for_delivery → delivered
   └──────────────→ cancelled (customer within window, or admin)
```

An order can only be marked **delivered** after the rider records the cash payment.

---

## Scripts

| Command                         | Description                      |
| ------------------------------- | -------------------------------- |
| `npm run dev --workspace=<app>` | Start an app in development mode |
| `npm run build`                 | Build all workspaces             |
| `npm run lint`                  | ESLint across the repo           |
| `npm run typecheck`             | TypeScript type checking         |
| `npm test`                      | Run unit and integration tests   |

---

## Deployment

| Component       | Platform                                                             |
| --------------- | -------------------------------------------------------------------- |
| Backend API     | Render (web service, health check at `/health`)                      |
| Admin dashboard | Vercel                                                               |
| Mobile app      | EAS Build → Google Play (Android). iOS is planned for a later phase. |
| Database        | MongoDB Atlas                                                        |

```bash
# Android release build
cd apps/mobile
eas build --profile production --platform android
eas submit --platform android
```

---

## Project Timeline (14 weeks, Aug–Nov 2026)

| Weeks | Phase                                                        |
| ----- | ------------------------------------------------------------ |
| 1–6   | Problem identification, requirements and solution definition |
| 7–8   | UI and database design                                       |
| 9–10  | Customer and ordering features                               |
| 10–11 | Delivery, payments and admin features                        |
| 12    | Integration and system testing                               |
| 13    | User acceptance testing and documentation                    |
| 14    | Deployment and final demonstration                           |

The project follows an **Agile** methodology with short iterations and regular feedback from the service provider.

---

## Contributing

1. Create a branch from `main`: `feature/<short-description>`
2. Follow the conventions in `docs/architecture.md` §16 (shared enums, server-side pricing, `orders.service.transition()` for status changes).
3. Run `npm run lint && npm run typecheck && npm test` before pushing.
4. Open a pull request and request a review from at least one team member.

---

## Team (Group 07)

| Index No  | Name                |
| --------- | ------------------- |
| 22CIS0324 | L.H.S.H. Dilrukshi  |
| 22CIS0331 | H.K.A. Uthkarsha    |
| 22CIS0327 | H.M.C.B. Subasinghe |
| 22CIS0342 | T. Saruhasan        |
| 22CIS0335 | R. Kirisshoban      |
| 22CIS0337 | M. Sharupan         |

---

## License

Developed for academic purposes as part of the IS5109 module at Sabaragamuwa University of Sri Lanka, in collaboration with Uni Delivery. Contact the team before any reuse.
