# Uni Deliver: System Architecture

> **Audience:** developers and AI coding agents working on this codebase.
> **Status:** v1.0 (initial Android release, IS5109 Group 07, Sabaragamuwa University of Sri Lanka)
> **Source of truth:** this file. If code and this file disagree, raise it. Do not silently diverge.

---

## 0. TL;DR for Agents

| Fact      | Value                                                                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product   | Community food ordering and delivery service for Pambahinna / Balangoda. The service provider buys food from outlets (Pizza Hut, KFC, local eateries) on the customer's behalf and delivers it. |
| Clients   | **ONE** mobile app (customer + delivery agent) and **ONE** web admin dashboard                                                                                                                  |
| Mobile    | React Native + Expo + **Expo Router** + TypeScript                                                                                                                                              |
| Admin web | Next.js (App Router) + TypeScript                                                                                                                                                               |
| Backend   | Node.js + Express + TypeScript, REST API under `/api/v1` and Socket.IO for realtime                                                                                                             |
| Database  | MongoDB Atlas via Mongoose                                                                                                                                                                      |
| Auth      | Firebase Authentication (identity) and a MongoDB `users` record (role and profile)                                                                                                              |
| Push      | Firebase Cloud Messaging (via Expo Notifications for device tokens)                                                                                                                             |
| Payment   | **Cash on Delivery only.** No payment gateway.                                                                                                                                                  |
| Hosting   | API: Render. Admin: Vercel. Mobile builds: EAS. DB: MongoDB Atlas.                                                                                                                              |
| Roles     | `customer`, `rider` (delivery agent), `admin`                                                                                                                                                   |
| Key rule  | The mobile app decides which UI to show **from the `role` returned by the backend auth response** (`GET /api/v1/auth/me`). There is no separate rider app.                                      |

**Terminology:** "Rider", "Delivery Agent" and "Driver" all mean the same thing. In code always use **`rider`**. "Restaurant", "Outlet" and "Food Outlet" mean the same thing. In code always use **`restaurant`**.

---

## 1. Context

### 1.1 Problem

Orders are currently placed in a WhatsApp group. The owner (Mr. H. T. M. Bhashitha, Uni Delivery) reads messages, buys food from outlets, delivers it, and collects food cost plus delivery fee in cash. Tracking orders, statuses and payments over chat does not scale.

### 1.2 What the system does

- Customers browse outlets and menus, place orders, see the cost breakdown, and track status.
- Riders see available orders, accept or reject them, update progress, and record cash collection.
- The admin (service provider) manages outlets, menus, users, riders, fees and settings, monitors all orders and views reports.
- **Food outlets do not use the system.** They are data managed by the admin.

### 1.3 Out of scope (v1)

Online payments, iOS App Store publication, outlet-facing app, live GPS rider tracking on a map, ratings, promo codes, multi-tenant support.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────┐      ┌──────────────────────────────┐
│  Uni Deliver Mobile App (Expo)      │      │  Admin Dashboard (Next.js)   │
│  ┌───────────────┐ ┌──────────────┐ │      │  Hosted on Vercel            │
│  │ Customer UI   │ │ Rider UI     │ │      │  Admin role only             │
│  │ (role=customer│ │ (role=rider) │ │      └──────────────┬───────────────┘
│  └───────┬───────┘ └──────┬───────┘ │                     │
│          └──── Role Router ┘        │                     │
└──────────────────┬──────────────────┘                     │
                   │ HTTPS REST + Socket.IO (WSS)           │
                   │ Authorization: Bearer <Firebase ID token>
                   ▼                                        ▼
        ┌─────────────────────────────────────────────────────────┐
        │           Backend API: Node.js + Express (Render)       │
        │  Auth middleware → RBAC → Validation → Controllers      │
        │  Services (business rules) → Repositories (Mongoose)    │
        │  Socket.IO gateway  │  Notification service  │ Audit log │
        └───────┬─────────────────────┬───────────────────┬───────┘
                │                     │                   │
                ▼                     ▼                   ▼
        ┌──────────────┐     ┌──────────────────┐   ┌──────────────┐
        │ MongoDB Atlas│     │ Firebase Admin   │   │ FCM / Expo   │
        │ (data)       │     │ (verify tokens)  │   │ Push service │
        └──────────────┘     └──────────────────┘   └──────────────┘
```

**Principles**

1. **Thin clients, authoritative server.** Prices, totals, delivery fees, status transitions and permissions are decided by the backend only (SR08). Clients send intent, never trusted amounts.
2. **One mobile codebase, role-based navigation.** Customer and rider screens live in one Expo app, separated by route groups and guarded by role.
3. **Layered backend.** `routes → middleware → controller → service → repository/model`. Business rules live only in services.
4. **Shared contracts.** Types, enums and validation schemas live in `packages/shared` and are imported by all three apps.

---

## 3. Repository Layout (Monorepo)

Use npm/pnpm workspaces.

```
uni-deliver/
├── apps/
│   ├── mobile/                 # Expo app (customer + rider)
│   ├── admin/                  # Next.js admin dashboard
│   └── api/                    # Express backend
├── packages/
│   └── shared/                 # Types, enums, zod schemas, constants
│       └── src/
│           ├── enums.ts        # Role, OrderStatus, PaymentStatus...
│           ├── schemas/        # zod request/response schemas
│           ├── types/          # DTO types inferred from schemas
│           └── constants.ts    # e.g. CANCELLATION_WINDOW default
├── docs/
│   └── architecture.md         # this file
├── .github/workflows/          # CI: lint, typecheck, test
└── package.json                # workspaces
```

---

## 4. Shared Contracts (`packages/shared`)

### 4.1 Enums

```ts
export enum Role {
  CUSTOMER = "customer",
  RIDER = "rider",
  ADMIN = "admin",
}

export enum OrderStatus {
  PENDING = "pending", // placed by customer, waiting for admin/rider
  ACCEPTED = "accepted", // a rider has accepted / been assigned
  PREPARING = "preparing", // rider is purchasing / outlet preparing
  PICKED_UP = "picked_up", // food collected from outlet
  OUT_FOR_DELIVERY = "out_for_delivery", // on the way to customer
  DELIVERED = "delivered", // handed over (terminal)
  CANCELLED = "cancelled", // terminal
}

export enum PaymentMethod {
  COD = "cod",
} // only option in v1
export enum PaymentStatus {
  UNPAID = "unpaid",
  COLLECTED = "collected",
}
export enum AccountStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
}
```

### 4.2 Validation

All request bodies are defined as **zod** schemas in `packages/shared/src/schemas`. The API validates with them (SR06). Clients use the same schemas for form validation.

---

## 5. Authentication & Role-Based Navigation

### 5.1 Identity vs. authorization

- **Firebase Authentication** owns identity: phone number + OTP (primary for customers and riders) and optionally email/password. Firebase handles password hashing (SR02), OTP and brute-force throttling (SR09).
- **MongoDB `users` collection** owns authorization and profile: `role`, `status`, name, addresses, push tokens.
- The backend trusts **only** a verified Firebase ID token, then loads the user from MongoDB. The role in MongoDB is the source of truth. Optionally it is mirrored into a Firebase custom claim (`role`) for convenience, but the server never trusts the claim alone.

> Note: the proposal mentions both JWT and Firebase Auth. Firebase ID tokens **are** JWTs (RFC 7519). No separate custom JWT system is built.

### 5.2 Account creation rules

| Role       | How it is created                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customer` | Self-registration in the mobile app. Backend creates the user with `role: customer`.                                                                                                                      |
| `rider`    | **Admin creates** the rider in the dashboard (phone number). When that phone signs in on the mobile app, the backend links the Firebase UID to the pre-created rider record. Riders cannot self-register. |
| `admin`    | Seeded by script (`apps/api/scripts/seed-admin.ts`). Never creatable via public API.                                                                                                                      |

### 5.3 Login sequence (mobile)

```
Mobile App                    Firebase Auth              Backend API             MongoDB
    │  signInWithPhoneNumber() ──►│                           │                     │
    │◄── confirm OTP / idToken ───│                           │                     │
    │  POST /api/v1/auth/session  (Bearer idToken) ──────────►│                     │
    │                             │   verifyIdToken() ◄───────│                     │
    │                             │                           │ find by firebaseUid │
    │                             │                           │ or phone (rider     │
    │                             │                           │ link) or create     │
    │                             │                           │ customer ─────────► │
    │◄──── 200 { user: { id, name, role, status, ... } } ─────│                     │
    │
    │  RoleRouter: role === 'customer' → /(customer)/home
    │              role === 'rider'    → /(rider)/available
    │              role === 'admin'    → /unsupported-role ("use the web dashboard")
    │              status === 'suspended' → /account-suspended
```

**Auth response contract** (`POST /auth/session` and `GET /auth/me` return the same shape):

```json
{
  "user": {
    "id": "6650f...",
    "role": "customer",
    "status": "active",
    "name": "Kasun Perera",
    "phone": "+94771234567",
    "email": null,
    "profileComplete": true
  }
}
```

- If `profileComplete === false` (new customer), route to `/(auth)/complete-profile` before the role home.
- On app start, if a Firebase session exists, call `GET /auth/me` and route the same way. Never route from cached role alone; use the cached role only to render a splash while `/auth/me` resolves.

### 5.4 Mobile route structure (Expo Router)

```
apps/mobile/app/
├── _layout.tsx                 # Providers: QueryClient, AuthProvider, Socket, Theme
├── index.tsx                   # Splash + RoleRouter (redirects based on auth state/role)
├── (auth)/
│   ├── _layout.tsx             # Only accessible when signed out
│   ├── welcome.tsx
│   ├── phone-login.tsx
│   ├── verify-otp.tsx
│   └── complete-profile.tsx
├── (customer)/
│   ├── _layout.tsx             # GUARD: role must be 'customer', else <Redirect href="/" />
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tabs: Home, Orders, Profile
│   │   ├── home.tsx            # Restaurant list + search/filter
│   │   ├── orders.tsx          # Order history
│   │   └── profile.tsx         # Profile + saved addresses
│   ├── restaurant/[id].tsx     # Menu of one outlet
│   ├── cart.tsx                # Cart + cost breakdown
│   ├── checkout.tsx            # Address, instructions, confirm (COD)
│   ├── order/[id].tsx          # Live order status + invoice
│   └── addresses/
│       ├── index.tsx
│       └── edit.tsx
├── (rider)/
│   ├── _layout.tsx             # GUARD: role must be 'rider'
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tabs: Available, Active, History, Profile
│   │   ├── available.tsx       # Pending orders to accept/reject
│   │   ├── active.tsx          # My in-progress deliveries
│   │   ├── history.tsx         # Completed deliveries + earnings
│   │   └── profile.tsx
│   └── delivery/[orderId].tsx  # Customer details, items, status buttons, "Cash collected"
├── unsupported-role.tsx
└── account-suspended.tsx
```

**Guard implementation (pattern every role layout must follow):**

```tsx
// app/(rider)/_layout.tsx
export default function RiderLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.role !== Role.RIDER) return <Redirect href="/" />;
  return <Stack />;
}
```

UI guards are for UX only. **Real enforcement is on the server** (Section 7.3).

### 5.5 Mobile app internal structure

```
apps/mobile/src/
├── api/
│   ├── client.ts            # axios instance; injects fresh Firebase ID token; 401 → signOut
│   ├── auth.api.ts
│   ├── restaurants.api.ts
│   ├── orders.api.ts
│   └── rider.api.ts
├── features/
│   ├── auth/                # AuthProvider, useAuth(), RoleRouter
│   ├── customer/            # components + hooks used only by customer screens
│   ├── rider/               # components + hooks used only by rider screens
│   └── shared/              # cross-role components (OrderStatusBadge, PriceBreakdown)
├── store/
│   └── cart.store.ts        # Zustand; cart is client-only until checkout; one restaurant per cart
├── realtime/socket.ts       # Socket.IO client, connects with ID token after login
├── notifications/push.ts    # Expo Notifications: permission, token → POST /users/me/push-token
├── hooks/                   # useNetworkStatus, useIdempotencyKey
├── theme/
└── utils/                   # currency formatting (LKR), dates
```

**State management**

- Server state: **TanStack Query** (cache, retries, refetch on socket events).
- Client state: **Zustand** (cart, UI prefs).
- Auth state: React Context (`AuthProvider`) wrapping Firebase `onIdTokenChanged`.
- Logout: Firebase `signOut()`, `DELETE /users/me/push-token`, clear query cache and cart, disconnect socket (SR07).

---

## 6. Admin Dashboard (`apps/admin`)

- Next.js App Router, TypeScript, Tailwind + a component library (e.g. shadcn/ui), TanStack Query.
- Login with Firebase email/password. After sign-in it calls `GET /api/v1/auth/me`; **if `role !== 'admin'`, sign out and show "Access denied".**
- Talks to the same REST API and Socket.IO server (joins `admins` room for new-order alerts).

```
apps/admin/app/
├── login/page.tsx
└── (dashboard)/
    ├── layout.tsx            # admin guard + sidebar
    ├── page.tsx              # Overview: live orders, today's KPIs
    ├── orders/page.tsx       # All orders, filters, assign rider, cancel
    ├── orders/[id]/page.tsx
    ├── restaurants/...       # CRUD outlets + menu items, toggle availability
    ├── riders/...            # Create/suspend riders, view earnings
    ├── customers/...         # View/suspend customers
    ├── settings/page.tsx     # Delivery zones & fees, cancellation window, service hours
    ├── reports/page.tsx      # Daily orders, revenue, rider performance
    └── feedback/page.tsx     # Complaints/feedback handling
```

---

## 7. Backend API (`apps/api`)

### 7.1 Structure

```
apps/api/src/
├── app.ts                    # express app, helmet, cors, rate limit, json, routes, error handler
├── server.ts                 # http server + Socket.IO bootstrap
├── config/
│   ├── env.ts                # zod-validated env vars
│   ├── db.ts                 # mongoose connection
│   └── firebase.ts           # firebase-admin init
├── middleware/
│   ├── authenticate.ts       # verify Firebase ID token → req.user (from Mongo)
│   ├── authorize.ts          # authorize(...roles)
│   ├── validate.ts           # validate(zodSchema) for body/query/params
│   ├── idempotency.ts        # Idempotency-Key handling for POST /orders
│   ├── rateLimit.ts
│   └── errorHandler.ts
├── modules/                  # one folder per module (matches proposal Section 5)
│   ├── auth/                 # session, me
│   ├── users/                # profile, addresses, push tokens, admin user mgmt
│   ├── restaurants/          # restaurants + menu items
│   ├── orders/               # cart pricing, place, cancel, history, status machine
│   ├── delivery/             # rider: available, accept/reject, progress, earnings
│   ├── payments/             # COD collection, invoices, payment history
│   ├── settings/             # zones, fees, cancellation window, hours
│   ├── reports/              # aggregations for admin
│   ├── feedback/
│   └── notifications/        # FCM sender + socket emitter (internal service)
│       # each module: *.routes.ts, *.controller.ts, *.service.ts, *.model.ts, *.test.ts
├── realtime/
│   └── socket.ts             # auth handshake, rooms, emit helpers
├── audit/
│   └── audit.service.ts      # writes auditLogs (SR10)
└── utils/
    ├── errors.ts             # AppError(code, httpStatus, message)
    └── money.ts              # integer LKR arithmetic
```

### 7.2 Request pipeline

`helmet → cors → rateLimit → express.json → authenticate → authorize(roles) → validate(schema) → controller → service → model`, then `errorHandler`.

### 7.3 Authorization rules (SR03, SR04)

- **Role-level:** every route declares allowed roles with `authorize(...)`.
- **Record-level:**
  - Customers can read and modify only orders where `order.customerId === req.user.id`.
  - Riders can see **pending** orders (limited fields: outlet, items, delivery zone, fee; **no customer phone**) and **full** customer contact and address only for orders where `order.riderId === req.user.id`.
  - Admin can access everything.
- Suspended users receive `403 ACCOUNT_SUSPENDED` on every endpoint except `GET /auth/me`.

### 7.4 Response & error format

Success:

```json
{ "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 57 } }
```

Error:

```json
{
  "error": {
    "code": "ORDER_NOT_CANCELLABLE",
    "message": "Order can no longer be cancelled.",
    "details": null
  }
}
```

Standard codes: `UNAUTHENTICATED (401)`, `FORBIDDEN (403)`, `ACCOUNT_SUSPENDED (403)`, `NOT_FOUND (404)`, `VALIDATION_ERROR (422)`, `INVALID_STATUS_TRANSITION (409)`, `ORDER_ALREADY_TAKEN (409)`, `ORDER_NOT_CANCELLABLE (409)`, `RESTAURANT_UNAVAILABLE (409)`, `ITEM_UNAVAILABLE (409)`, `SERVICE_CLOSED (409)`, `RATE_LIMITED (429)`, `INTERNAL (500)`.

### 7.5 REST endpoints (`/api/v1`)

**Auth**
| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/session` | any signed-in Firebase user | Create/link Mongo user, return user + role |
| GET | `/auth/me` | any | Current user + role (used for routing) |

**Users / profile**
| Method | Path | Roles | Purpose |
|---|---|---|---|
| PATCH | `/users/me` | customer, rider | Update name/email |
| GET/POST | `/users/me/addresses` | customer | List/add saved addresses |
| PATCH/DELETE | `/users/me/addresses/:addressId` | customer | Edit/delete address |
| POST | `/users/me/push-token` | customer, rider | Register Expo/FCM token |
| DELETE | `/users/me/push-token` | customer, rider | Remove token on logout |
| GET | `/admin/users?role=&status=` | admin | List users |
| POST | `/admin/riders` | admin | Pre-create rider (name, phone, vehicleNo) |
| PATCH | `/admin/users/:id/status` | admin | Activate/suspend |

**Restaurants & menus**
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/restaurants?search=&category=` | any | Active restaurants |
| GET | `/restaurants/:id` | any | Restaurant detail |
| GET | `/restaurants/:id/menu` | any | Available menu items grouped by category |
| POST/PATCH/DELETE | `/admin/restaurants[/:id]` | admin | CRUD (delete = soft deactivate) |
| PATCH | `/admin/restaurants/:id/availability` | admin | Open/close |
| POST/PATCH/DELETE | `/admin/restaurants/:id/menu-items[/:itemId]` | admin | Menu CRUD + availability |

**Orders (customer)**
| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/orders/quote` | customer | Server-priced preview: items, subtotal, delivery fee, total |
| POST | `/orders` | customer | Place order (requires `Idempotency-Key` header) |
| GET | `/orders/mine?status=` | customer | Order history |
| GET | `/orders/:id` | owner customer, assigned rider, admin | Order detail + timeline |
| POST | `/orders/:id/cancel` | customer (own, in window), admin | Cancel |

**Delivery (rider)**
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/rider/orders/available` | rider | Pending, unassigned orders (redacted) |
| POST | `/rider/orders/:id/accept` | rider | Atomic claim |
| POST | `/rider/orders/:id/reject` | rider | Hide this order for this rider |
| GET | `/rider/orders/active` | rider | My in-progress orders |
| PATCH | `/rider/orders/:id/status` | rider (assigned) | Body `{ status }`; validated by state machine |
| POST | `/rider/orders/:id/collect-payment` | rider (assigned) | Record COD collected (amount must equal `pricing.total`) |
| GET | `/rider/history?from=&to=` | rider | Completed deliveries + earnings summary |

**Admin orders, settings, reports, feedback**
| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/admin/orders?status=&from=&to=&riderId=` | admin | All orders |
| PATCH | `/admin/orders/:id/assign` | admin | Assign/reassign rider |
| PATCH | `/admin/orders/:id/status` | admin | Override status (audited) |
| GET/PUT | `/admin/settings` | admin | Zones/fees, cancellation window, service hours |
| GET | `/admin/reports/summary?from=&to=` | admin | Orders, revenue, delivery fees, per-rider stats |
| POST | `/feedback` | customer | Submit complaint/feedback (optional orderId) |
| GET/PATCH | `/admin/feedback[/:id]` | admin | List/resolve feedback |

---

## 8. Data Model (MongoDB Atlas)

Monetary values are stored as **integers in LKR cents** (`Number`), e.g. LKR 1,250.00 = `125000`. Never use floats for money. All collections have `createdAt` / `updatedAt` (Mongoose `timestamps: true`).

### 8.1 `users`

```ts
{
  _id: ObjectId,
  firebaseUid: string | null,     // unique, sparse (null until a pre-created rider first logs in)
  role: 'customer' | 'rider' | 'admin',
  status: 'active' | 'suspended',
  name: string,
  phone: string,                  // E.164, unique
  email?: string,
  addresses: [{                   // customers only
    _id: ObjectId,
    label: string,                // "Hostel", "Boarding"
    zoneId: ObjectId,             // → settings.deliveryZones
    addressLine1: string,
    addressLine2?: string,
    landmark?: string,            // hostel/building/room
    instructions?: string,
    isDefault: boolean
  }],
  rider?: { vehicleNo: string, isAvailable: boolean },  // riders only
  pushTokens: string[],
}
// Indexes: { firebaseUid: 1 } unique sparse, { phone: 1 } unique, { role: 1, status: 1 }
```

### 8.2 `restaurants`

```ts
{ _id, name, phone, address, area: string, categories: string[],
  imageUrl?: string, isActive: boolean, isOpen: boolean, sortOrder: number }
// Indexes: { isActive: 1, isOpen: 1 }, text index on { name, categories }
```

### 8.3 `menuItems`

```ts
{ _id, restaurantId: ObjectId, name, description?, category: string,
  price: number /*cents*/, imageUrl?: string, isAvailable: boolean }
// Indexes: { restaurantId: 1, isAvailable: 1 }
```

### 8.4 `orders` (central aggregate)

Order items, delivery address, pricing and payment are **embedded snapshots** so later menu or price edits never change historical orders (NFR08).

```ts
{
  _id: ObjectId,
  orderNo: string,                 // human-friendly, e.g. "UD-20261028-0042", unique
  customerId: ObjectId,
  restaurantId: ObjectId,
  restaurantSnapshot: { name, address, phone },
  items: [{ menuItemId, name, unitPrice, quantity, subtotal }],   // snapshot at order time
  deliveryAddress: { label, zoneId, zoneName, addressLine1, addressLine2, landmark, instructions },
  customerContact: { name, phone },
  pricing: { itemsSubtotal, deliveryFee, total },                 // computed by server
  status: OrderStatus,
  statusHistory: [{ status, at: Date, byUserId: ObjectId, byRole: Role, note?: string }],
  riderId: ObjectId | null,
  rejectedByRiderIds: ObjectId[],
  payment: {
    method: 'cod',
    status: 'unpaid' | 'collected',
    amountCollected?: number,
    collectedAt?: Date,
    collectedBy?: ObjectId
  },
  cancellation?: { byRole: Role, reason?: string, at: Date },
  idempotencyKey: string,          // from client header
  placedAt: Date,
  deliveredAt?: Date
}
// Indexes:
//   { customerId: 1, placedAt: -1 }
//   { status: 1, riderId: 1, placedAt: -1 }
//   { riderId: 1, status: 1 }
//   { customerId: 1, idempotencyKey: 1 } unique   ← prevents duplicate orders (NFR03)
//   { orderNo: 1 } unique
```

### 8.5 `settings` (singleton document, `_id: 'global'`)

```ts
{
  deliveryZones: [{ _id, name: string, fee: number /*cents*/, isActive: boolean }],
  cancellationWindowMinutes: number,     // default 5
  serviceHours: { open: 'HH:mm', close: 'HH:mm', timezone: 'Asia/Colombo' },
  isAcceptingOrders: boolean,            // admin kill-switch
  minOrderAmount?: number,
  riderEarningPercentOfFee: number       // for rider earnings view, default 100
}
```

Delivery fee is **zone-based** in v1 (the customer's saved address references a zone). Distance-based pricing is a future upgrade.

### 8.6 `feedback`

```ts
{ _id, customerId, orderId?: ObjectId, message: string,
  status: 'open' | 'resolved', adminNote?: string }
```

### 8.7 `auditLogs` (SR10)

```ts
{ _id, actorId, actorRole, action: string /* e.g. 'order.status.update', 'payment.collect', 'settings.update' */,
  entity: string, entityId: ObjectId|string, before?: object, after?: object, at: Date, ip?: string }
// Never log tokens, OTPs or passwords. TTL index optional (e.g. 365 days).
```

### 8.8 Mapping from proposal ER/class diagrams

| Proposal entity   | Implementation                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Customer, Driver  | `users` with `role`                                                                             |
| Restaurant        | `restaurants`                                                                                   |
| Food_Item         | `menuItems`                                                                                     |
| Order, Order_Item | `orders` with embedded `items[]`                                                                |
| Delivery          | fields on `orders` (`riderId`, `status`, `statusHistory`, `pricing.deliveryFee`, `deliveredAt`) |
| Payment           | embedded `orders.payment`                                                                       |
| Location          | embedded `users.addresses[]` and `orders.deliveryAddress` snapshot                              |

---

## 9. Order Lifecycle (State Machine)

```
            ┌──────────── cancel (customer within window, or admin) ─────────────┐
            │                                                                    ▼
 PENDING ──accept (rider) / assign (admin)──► ACCEPTED ──► PREPARING ──► PICKED_UP ──► OUT_FOR_DELIVERY ──► DELIVERED
            ▲                                    │  (admin only can cancel after ACCEPTED)
            └──── unassign (admin) ──────────────┘
```

**Allowed transitions (enforced in `orders.service.ts`, single function `transition(order, to, actor)`):**

| From                  | To               | Who                                                                       |
| --------------------- | ---------------- | ------------------------------------------------------------------------- |
| pending               | accepted         | rider (via accept), admin (via assign)                                    |
| pending               | cancelled        | customer (owner, within `cancellationWindowMinutes` of `placedAt`), admin |
| accepted              | pending          | admin (unassign)                                                          |
| accepted              | preparing        | assigned rider, admin                                                     |
| accepted / preparing  | cancelled        | admin only                                                                |
| preparing             | picked_up        | assigned rider, admin                                                     |
| picked_up             | out_for_delivery | assigned rider, admin                                                     |
| out_for_delivery      | delivered        | assigned rider, admin. **Requires `payment.status === 'collected'`**      |
| delivered / cancelled | (none)           | terminal                                                                  |

Any other transition returns `409 INVALID_STATUS_TRANSITION`. Every transition appends to `statusHistory`, writes an audit log, and triggers notifications (Section 10).

**Concurrency:**

- **Rider accept is atomic:**
  `findOneAndUpdate({ _id, status: 'pending', riderId: null }, { $set: { status: 'accepted', riderId }, $push: {...} }, { new: true })`. If `null` is returned, respond `409 ORDER_ALREADY_TAKEN`.
- All status updates use a conditional filter on the expected current status (optimistic concurrency).
- **Reject** only adds the rider to `rejectedByRiderIds`; the order stays `pending` for others. Available list excludes orders the rider rejected.

---

## 10. Realtime & Notifications

### 10.1 Socket.IO

- Client connects with `auth: { token: <Firebase ID token> }`; the server verifies it during the handshake and loads the user.
- Rooms joined automatically on connect:
  - `user:<userId>` (everyone)
  - `riders` (role rider, active)
  - `admins` (role admin)
- Events (server → client). Payloads are minimal; clients refetch through REST (TanStack Query invalidation).

| Event             | Room(s)                                         | Payload                                                 |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `order:new`       | `admins`, `riders`                              | `{ orderId, orderNo, restaurantName, zoneName, total }` |
| `order:updated`   | `user:<customerId>`, `user:<riderId>`, `admins` | `{ orderId, status, riderId }`                          |
| `order:taken`     | `riders`                                        | `{ orderId }` (remove from others' available list)      |
| `order:cancelled` | `user:<riderId>`, `admins`, `riders`            | `{ orderId }`                                           |

Socket is a convenience; the app must work correctly with REST polling or pull-to-refresh if the socket is disconnected.

### 10.2 Push notifications

- Mobile registers its Expo push token (backed by FCM on Android) via `POST /users/me/push-token`.
- `notifications.service.ts` sends pushes on: order accepted, picked up, out for delivery, delivered, cancelled (to customer); new order available (to active riders); assigned by admin (to rider).
- Invalid tokens returned by the push service are removed from `users.pushTokens`.
- Notification `data` always includes `{ type, orderId }`; tapping deep-links to `/(customer)/order/[id]` or `/(rider)/delivery/[orderId]` depending on role.

---

## 11. Key Flows

### 11.1 Customer places an order

1. Customer adds items to the local cart (Zustand). **A cart holds items from one restaurant only**; adding from another restaurant prompts to clear the cart.
2. Checkout screen calls `POST /orders/quote` `{ restaurantId, items:[{menuItemId, quantity}], addressId }` → server returns current prices, delivery fee from the address zone, total, and any unavailable items.
3. Customer confirms. App generates a UUID **once per checkout attempt** and sends `POST /orders` with header `Idempotency-Key: <uuid>`. Retries reuse the same key.
4. Server checks: service open & `isAcceptingOrders`, restaurant active/open, items available, quantity 1–20, recalculates pricing (ignores any client price), snapshots items/address, creates order `pending`.
5. If the `(customerId, idempotencyKey)` already exists, return the existing order with `200` instead of creating a new one.
6. Emit `order:new`, push to riders. Customer is navigated to `/(customer)/order/[id]`.

### 11.2 Rider delivers

1. Rider opens **Available** tab → `GET /rider/orders/available`.
2. Accept → atomic claim; on success navigate to `/(rider)/delivery/[orderId]` showing full customer contact and address.
3. Rider taps through `preparing → picked_up → out_for_delivery`.
4. On handover rider taps **"Cash collected (LKR X)"** → `POST /rider/orders/:id/collect-payment`, then **"Mark delivered"**. (UI may combine both into one confirm dialog that calls both endpoints in order.)

### 11.3 Admin

Monitors live orders, can assign/reassign riders, override statuses (audited), manage outlets/menus/fees/users, and view reports built with MongoDB aggregation on `orders` (delivered orders by day, revenue = Σ `pricing.total`, delivery fee income = Σ `pricing.deliveryFee`, per-rider counts).

---

## 12. Security (maps to SR01–SR10)

| ID                         | Implementation                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| SR01 Authentication        | `authenticate` middleware on all routes except `GET /health` and public restaurant reads (optional).                                    |
| SR02 Password protection   | Delegated to Firebase Auth. Backend never sees or stores passwords.                                                                     |
| SR03 RBAC                  | `authorize(...roles)` on every route; admin routes under `/admin/*`.                                                                    |
| SR04 Record-level access   | Ownership checks in services; rider sees customer contact only when assigned.                                                           |
| SR05 HTTPS                 | Render/Vercel TLS; mobile uses `https://` and `wss://` only.                                                                            |
| SR06 Input validation      | zod schemas on body/query/params; Mongo ObjectId validation; strip unknown fields.                                                      |
| SR07 Session protection    | Firebase ID tokens (1-hour expiry, auto-refresh), stored by Firebase SDK in secure storage; logout clears tokens, cache and push token. |
| SR08 Transaction integrity | All money computed server-side; status machine; COD amount must equal `pricing.total`.                                                  |
| SR09 Login protection      | Firebase built-in OTP throttling plus `express-rate-limit` on `/auth/*` and `POST /orders`.                                             |
| SR10 Activity logging      | `auditLogs` for admin changes, status updates and payment collection; no secrets logged.                                                |

Also: `helmet`, strict CORS (admin domain + no-origin mobile), `mongo-sanitize`, request body size limit (100 kb), secrets only via environment variables.

---

## 13. Non-Functional Requirements Mapping

| NFR                     | Approach                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| NFR01 Usability         | Max 3 taps from home to cart; large touch targets; English UI (i18n-ready with `i18next` for Sinhala/Tamil later).                 |
| NFR02 Performance ≤ 3 s | Indexed queries, paginated lists (20/page), lean Mongoose queries, image thumbnails.                                               |
| NFR03 Reliability       | Idempotency key on order creation; atomic accept.                                                                                  |
| NFR04 Availability      | Health check `GET /health`; uptime ping to keep Render instance warm during service hours; `SERVICE_CLOSED` message outside hours. |
| NFR05 Compatibility     | Android 8.0+ (API 26+); test on at least one small (5") and one large (6.5"+) device.                                              |
| NFR06 Maintainability   | Module-per-folder, shared contracts, ESLint + Prettier, typed end to end.                                                          |
| NFR07 Scalability       | Stateless API (scale horizontally; Socket.IO Redis adapter if >1 instance).                                                        |
| NFR08 Data accuracy     | Integer money, price snapshots in orders.                                                                                          |
| NFR09 Recovery          | MongoDB Atlas backups/snapshots (or scheduled `mongodump` on free tier); restore tested before launch.                             |
| NFR10 Network handling  | `useNetworkStatus` offline banner; TanStack Query retries for GETs; POSTs retried only with idempotency key.                       |

---

## 14. Deployment & Environments

| Component       | Platform                                                | Notes                                                        |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| API + Socket.IO | Render (web service)                                    | `npm run build && npm start`; health check `/health`         |
| Admin           | Vercel                                                  | `NEXT_PUBLIC_API_URL`                                        |
| Mobile          | EAS Build → Google Play (internal testing → production) | Profiles: `development`, `preview` (APK), `production` (AAB) |
| Database        | MongoDB Atlas                                           | Separate DBs: `unideliver_dev`, `unideliver_prod`            |
| Auth/Push       | Firebase project                                        | One project per environment if possible                      |

**Environment variables**

`apps/api/.env`

```
NODE_ENV=development
PORT=4000
MONGODB_URI=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CORS_ORIGINS=http://localhost:3000,https://<admin>.vercel.app
```

`apps/mobile/.env`

```
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SOCKET_URL=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

`apps/admin/.env.local`

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

> Phone OTP with Firebase in React Native requires `@react-native-firebase/auth` and a **development build** (not Expo Go). Use `npx expo prebuild` / EAS dev builds.

---

## 15. Testing Strategy

| Layer           | Tooling                                                            | Must cover                                                                                        |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| API unit        | Jest                                                               | State machine transitions, pricing, cancellation window, fee lookup                               |
| API integration | Jest + Supertest + `mongodb-memory-server`; Firebase verify mocked | RBAC per route, record-level access, idempotent order creation, concurrent accept (only one wins) |
| Mobile          | Jest + React Native Testing Library                                | RoleRouter routing per role/status, cart single-restaurant rule                                   |
| E2E (optional)  | Maestro                                                            | Customer places order → rider delivers                                                            |
| UAT             | Week 13 with the service provider                                  | Real orders in Pambahinna/Balangoda                                                               |

---

## 16. Conventions for Contributors & AI Agents

1. **Language:** TypeScript everywhere, `strict: true`. No `any` without a comment explaining why.
2. **Naming:** files `kebab-case` or `module.layer.ts` (e.g. `orders.service.ts`); React components `PascalCase`; DB fields `camelCase`; collection names plural `camelCase`.
3. **Never** compute prices, fees or totals on the client for anything the server stores. Clients display server values.
4. **Never** add a status or role string inline. Import from `packages/shared/src/enums.ts`.
5. **Every new endpoint** must: declare roles with `authorize`, validate with a zod schema in `packages/shared`, enforce record-level access in the service, write an audit log if it mutates orders/payments/settings/users, and have an integration test.
6. **Every new mobile screen** goes under the correct route group: `(customer)`, `(rider)` or `(auth)`. Screens shared by both roles go in `src/features/shared` as components, not as shared routes.
7. Status changes go through `orders.service.transition()` only. Do not `updateOne({ status })` anywhere else.
8. Money is integer cents. Format with `utils/currency.ts` (`LKR 1,250.00`).
9. Times stored in UTC; displayed in `Asia/Colombo`.
10. Keep this document updated when adding modules, endpoints, collections or statuses.

---

## 17. Module ↔ Requirement Traceability

| Module (proposal §5)    | Backend module(s)                                  | Mobile area                            | Admin area                   | Requirements                            |
| ----------------------- | -------------------------------------------------- | -------------------------------------- | ---------------------------- | --------------------------------------- |
| 1. User Management      | `auth`, `users`                                    | `(auth)`, profile tabs                 | riders, customers            | FR01, FR04, FR12, SR01–SR04, SR07, SR09 |
| 2. Restaurant & Menu    | `restaurants`                                      | customer home, restaurant/[id]         | restaurants                  | FR02, FR11                              |
| 3. Order Management     | `orders`                                           | cart, checkout, order/[id], orders tab | orders                       | FR03, FR05, FR06, FR07, NFR03, NFR08    |
| 4. Delivery Management  | `delivery`, `settings`                             | `(rider)`                              | orders (assign), settings    | FR08, FR09, FR13                        |
| 5. Payment              | `payments`                                         | order invoice, rider collect           | reports                      | FR10, SR08                              |
| 6. Admin & Notification | `reports`, `feedback`, `notifications`, `realtime` | push handling                          | dashboard, reports, feedback | FR14, SR10                              |

---

## 18. Future Extensions (not v1)

- Online payments (e.g. PayHere) as a new `PaymentMethod`.
- iOS release via App Store.
- Distance-based fees using map coordinates on addresses.
- Live rider location tracking.
- Ratings and reviews; promo codes; Sinhala/Tamil localisation.
