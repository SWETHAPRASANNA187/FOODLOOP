# 🍲 FoodLoop — Real-Time Redis-Powered Food Rescue Platform

FoodLoop is an open-source, production-minded real-time surplus food redistribution network engineered **strictly and solely on Redis**. It connects restaurants, bakeries, hostels, verified NGOs, and volunteer couriers to eliminate food waste before it expires.

---

## 🌟 Key Features

- **Primary & Only Database**: Redis (Hashes, Sets, Sorted Sets, Streams, Geo, and Pub/Sub). Zero secondary databases used.
- **Atomic Concurrency Protection**: High-concurrency Lua scripts eliminate inventory overselling and race conditions when reserving surplus meals.
- **Dual Persistence Strategy**: Append-Only File (`appendfsync everysec`) + Periodic RDB snapshots (`save 900 1 / 300 10 / 60 1000`) with persistent Docker volumes.
- **Strict No-Eviction Policy**: `maxmemory-policy noeviction` ensures permanent business records, users, and food listings are never silently evicted.
- **Asynchronous Processing via Redis Streams**: Reliable consumer group workers (`foodloop:jobs`) process durable notifications and activity logs with acknowledgement (`XACK`).
- **Automated Food Expiration Worker**: Expiry Sorted Set (`food:expiry`) continuously scanned every 30s to transition expired listings and alert donors.
- **Real-Time WebSockets**: Socket.IO integrated with Redis Pub/Sub channels for instantaneous cross-instance event distribution.
- **Role-Based Workflows**: Full lifecycle support for `DONOR`, `RECIPIENT`, `VOLUNTEER`, and `ADMIN`.
- **Accessible Light Interface**: Clean palette with fresh forest greens, soft mint accents, Inter typography, and Recharts analytics.

---

## 🏗️ Architecture & Redis Key Schema

### Redis Key Patterns
| Key | Type | Purpose |
| :--- | :--- | :--- |
| `users:{userId}` | **Hash** | Persistent user profile and hashed password |
| `users:by-email:{email}` | **String** | Unique email to user ID lookup index |
| `users:all` | **Set** | All registered user IDs |
| `users:by-role:{role}` | **Set** | User IDs grouped by role (`DONOR`, `RECIPIENT`, `VOLUNTEER`, `ADMIN`) |
| `food:{foodId}` | **Hash** | Complete food listing record and available inventory |
| `food:all` | **Set** | All food listing IDs |
| `food:by-status:{status}` | **Set** | Maintained index by status (`AVAILABLE`, `RESERVED`, etc.) |
| `food:by-donor:{donorId}` | **Set** | Listings published by a specific donor |
| `food:by-category:{cat}` | **Set** | Listings grouped by category |
| `food:expiry` | **Sorted Set** | Score = UTC Epoch seconds; Member = `foodId` |
| `food:geo` | **GEO Set** | Proximity discovery index using coordinates |
| `reservations:{resId}` | **Hash** | Reservation data, quantity, and 6-digit pickup code |
| `reservations:all` | **Set** | All reservation IDs |
| `reservations:by-recipient:{id}` | **Set** | Reservations placed by recipient |
| `reservations:by-listing:{id}` | **Set** | Reservations for a particular listing |
| `pickups:{pickupId}` | **Hash** | Courier task state and assigned volunteer |
| `pickups:available` | **Set** | Pickup tasks open for volunteer claim |
| `pickups:by-volunteer:{id}` | **Set** | Tasks assigned to volunteer |
| `notifications:{userId}` | **List** | Capped notification feed (LTRIM 0 99) |
| `notifications:unread-count:{id}` | **String** | Unread counter incremented atomically |
| `activity:all` | **List** | Global audit event stream (LTRIM 0 199) |
| `foodloop:jobs` | **Stream** | Durable asynchronous worker queue |
| `foodloop:events` | **Pub/Sub** | Sub-millisecond broadcast channel for WebSockets |

---

## 🔒 Concurrency & Inventory Reservation Strategy

When a recipient reserves portions:
1. The backend triggers custom Lua script `ATOMIC_RESERVE_SCRIPT` via `redis.eval`.
2. The Lua script evaluates:
   - Does `food:{id}` exist?
   - Is status `AVAILABLE`?
   - Is current UTC epoch < expiration epoch?
   - Is `quantity >= requestedQty`?
3. If valid, quantity is decremented atomically, status updated to `RESERVED` if remaining quantity is 0, reservation hash written, and all secondary index sets updated within **one atomic transaction**.
4. If invalid, the script aborts immediately with a specific error code without modifying state.
5. If cancelled, `ATOMIC_CANCEL_RESERVATION_SCRIPT` restores the inventory quantity atomically and sets status back to `AVAILABLE`.

---

## 🚀 Quick Start (Local Windows Setup)

### 1. Start Persistent Redis
Make sure Docker Desktop is running, then launch Redis:
```powershell
cd c:\project\foodloop
docker compose up -d redis
```

### 2. Verify Redis Connectivity
```powershell
docker exec foodloop-redis redis-cli ping
# Output: PONG
```

### 3. Install Dependencies
```powershell
# Root, Server, and Client
cd c:\project\foodloop\server
cmd /c npm install

cd c:\project\foodloop\client
cmd /c npm install
```

### 4. Seed Development Data
Populates sample donors, bakeries, recipients, volunteers, food listings, and notifications:
```powershell
cd c:\project\foodloop\server
cmd /c npm run seed
```

**Pre-seeded Demo Accounts (Password: `Password123!`):**
- **Admin**: `admin@foodloop.org`
- **Donor (Bakery)**: `sunrise@bakery.com`
- **Donor (Hotel)**: `kitchen@harvesthotel.com`
- **Recipient (Shelter NGO)**: `shelter@hopecommunity.org`
- **Volunteer**: `alex.volunteer@gmail.com`

### 5. Run the Application
Open two command prompts:

**Terminal 1 — Backend API & Socket.IO:**
```powershell
cd c:\project\foodloop\server
cmd /c npm run dev
# Running on http://localhost:5000
```

**Terminal 2 — Frontend Light UI:**
```powershell
cd c:\project\foodloop\client
cmd /c npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Running Automated Tests

Run the Vitest test suite testing Redis connection, PING, email uniqueness, food CRUD, **atomic race-condition inventory limits**, and single-volunteer task claiming:
```powershell
cd c:\project\foodloop\server
cmd /c npm test
```

---

## 📖 API Documentation (`/api/v1`)

### Authentication
- `POST /api/v1/auth/register` — Create user account
- `POST /api/v1/auth/login` — Login & receive JWT / secure cookie
- `POST /api/v1/auth/logout` — Clear session
- `GET /api/v1/auth/me` — Current user profile
- `PATCH /api/v1/auth/profile` — Update user profile

### Food Listings
- `GET /api/v1/food` — Filter and search available listings
- `GET /api/v1/food/:id` — Listing details
- `POST /api/v1/food` — Donor lists surplus food
- `PATCH /api/v1/food/:id` — Update listing
- `DELETE /api/v1/food/:id` — Delete listing
- `GET /api/v1/food/nearby` — Geo proximity search

### Reservations
- `POST /api/v1/reservations` — Atomic food reservation
- `GET /api/v1/reservations/my` — Current user's reservations
- `PATCH /api/v1/reservations/:id/cancel` — Cancel and restore inventory

### Pickup & Volunteer
- `GET /api/v1/pickups/available` — Open tasks for volunteers
- `GET /api/v1/pickups/my` — Tasks claimed by volunteer
- `POST /api/v1/pickups/:id/accept` — Atomic task claim
- `PATCH /api/v1/pickups/:id/status` — Transit & delivery progress update

### Health & Analytics
- `GET /api/v1/health` — Liveness check
- `GET /api/v1/health/ready` — Redis connection, PING, and AOF status
- `GET /api/v1/analytics/dashboard` — Platform stats and category breakdown
- `GET /api/v1/analytics/public` — Real-time verified rescued meals counter
- `GET /api/v1/analytics/redis-health` — Live Redis memory & persistence info

---

## 🛡️ Persistence Durability Notes

FoodLoop uses Redis as its primary datastore:
- `appendonly yes` with `appendfsync everysec` provides durable write commits every 1 second.
- Periodic RDB snapshotting provides compact backup dumps.
- Docker volume `foodloop_redis_data` maps directly to `/data` in the container.
- *Durability limitation note*: In the event of an abrupt host OS power failure, up to 1 second of transactions might be lost under `everysec`. For absolute maximum durability, `appendfsync always` can be configured at the expense of write throughput.

---

## 📜 License
MIT © FoodLoop Open Source Initiative
