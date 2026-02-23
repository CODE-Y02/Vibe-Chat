# Express Route Cache Backend

A highly scalable, deeply optimized robust Hono backend built for 100K+ concurrent users. This serves as the operational intelligence suite providing real-time messaging, comprehensive matchmaking, robust social features (Friends, Reacts, Moderation), and full-scale Redis clustering.

## Features
- **Hono.js / Node Server**: Extreme speed edge-compatible framework.
- **Strictly Typed Architecture**: 100% End-to-End TypeScript utilizing Zod validation & generic bindings natively within all internal logic preventing Any assertions.
- **REST via OpenAPI**: Self-documenting swagger (`/docs/swagger`) & Scalar UIs mapping live specs over `/openapi.json`.
- **High-Profile WebSockets**: Complete native Socket.io setup synced internally via `ioredis` Redis clustering adapter (matchmaking, signaling, chats).
- **Postgres via Prisma**: Reliable schema with pre-built connection limiting pooling configurations.
- **Intelligent Caching Protocol**: DM list logic explicitly slice-mapped directly on Redis limiting SQL group mapping operations natively across instances.

## Requirements
- **Node.js**: v20+ recommended
- **Database**: PostgreSQL
- **Cache**: Redis *(fully optional for local development)*

---

## 🚀 Getting Started

### Local Development (Zero Docker)
We support booting completely offline skipping Redis caches cleanly by utilizing our `.env.local` layout natively falling back to `ioredis-mock`.

1. Create/Modify your generic `.env` or point straight into local configs:
   ```bash
   cp .env.local .env
   ```

2. Run the development server (uses `tsx` for fast HMT):
   ```bash
   npm run dev
   # OR
   bun dev
   ```

---

### Docker Built Environment (Production Sandbox Testing)
Our compose networks are already wired inside `package.json` correctly interpreting mapping boundaries (`db:5432`, `redis:6379`) preventing generic local overrides from ruining connectivity.

1. **Boot DB + Redis Services Only**: 
   (Ideal for linking native local `npm run dev` tests against actual Postgres caches!)
   ```bash
   npm run docker:infra
   ```

2. **Boot Entire Connected Docker Architecture**:
   Builds the TS backend natively mapping against `.env.docker` strictly syncing the Compose clusters.
   ```bash
   npm run docker:dev
   ```

3. **Tear down Docker Sandbox**:
   ```bash
   npm run docker:down
   ```

---

## Technical Specifications

### API Structure 
Base routing natively supports strictly validated inputs:
- `/auth` - JWT Generation, Refresh Tokens
- `/feed` - Posts, Reacts, Feeds mapped caching
- `/friends` - Social Network bindings
- `/messages` - Paginated DMs & Real-time caches
- `/moderation` - Network blocking/reporting filtering
- `/health` - Status monitor

### Caching Strategy
`USE_REDIS=true` connects our clustered engines syncing:
1. **Matchmaking Rate Limiting**: Redis explicitly maps wait cycles / Heartbeats.
2. **DM Conversations Sync**: All conversations dynamically cached into Redis slices validated gracefully limiting heavy Postgres loop maps to 1 SQL map per hour optimally. 
3. **Socket IO Adapter**: Multi-instance messaging.
