# Loopia

**Play now at [play.loopia.world](https://play.loopia.world)**

A browser-based MMORPG with real-time multiplayer, on-chain economy, and quest system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | Phaser 3 + TypeScript |
| Bundler | Vite |
| Multiplayer | Colyseus (WebSocket) |
| REST API | Express + Node.js |
| Database | PostgreSQL + Prisma ORM |
| Blockchain | Solidity on Avalanche Fuji (Hardhat) |
| Admin Panel | React 19 + React Router |

## Project Structure

```
loopia/
├── client/          # Phaser 3 game client
│   ├── src/
│   │   ├── scenes/      # 6 game scenes (GameScene, CafeScene, GrottoScene, etc.)
│   │   ├── services/    # Network, Auth, Shop, Quest, Wallet, Social
│   │   ├── ui/          # Panels, overlays, menus, dialogs
│   │   ├── managers/    # Audio, Input, Player managers
│   │   └── utils/       # Pathfinding
│   └── public/          # Assets (sprites, audio, UI icons)
├── server/
│   ├── src/
│   │   ├── rooms/       # Colyseus room handlers (BaseRoom + 6 rooms)
│   │   ├── auth/        # Guest auth + Twitter OAuth
│   │   ├── economy/     # Currency, daily login rewards
│   │   ├── shop/        # AVAX item shop + cafe shop
│   │   ├── quest/       # Quest system + fishing minigame
│   │   ├── social/      # Friends, DMs, blocks, cross-room messaging
│   │   ├── trade/       # Player-to-player trading
│   │   ├── wallet/      # Custodial wallet (AES-256-GCM encrypted)
│   │   ├── leveling/    # XP + level progression
│   │   └── admin/       # Admin API + auth
│   ├── contracts/       # ItemShop.sol (Solidity smart contract)
│   └── prisma/          # Schema, migrations, seeds
├── admin/               # React admin panel
├── shared/              # Constants + obstacle maps
└── tests/               # Vitest test suite
```

## Features

**Multiplayer** — Real-time state sync via Colyseus WebSocket. 6 interconnected rooms with portal-based navigation, pathfinding, and NPC interactions. Up to 50 players per room.

**Social** — Friend requests, direct messaging (same-room + cross-room), block list, respect/kudos system, player search.

**Economy** — Dual currency: AVAX (on-chain cosmetics) + Loopi (off-chain consumables). Daily login rewards with 30-day streak system.

**Blockchain** — Solidity smart contract on Avalanche Fuji testnet. Every purchase recorded as immutable `PurchaseRecord`, verifiable on Snowtrace. Custodial wallets with AES-256-GCM key encryption. AVAX withdraw support.

**Quest System** — Daily quests with XP rewards. Grotto Explorer (link submission, admin-reviewed) and Fishing minigame (timing-based). 7-day streak badges.

**Leveling** — Quadratic XP curve (`100 * level^2`), cross-room level-up notifications.

**Reconnection** — 30-second reconnection window on disconnect with exponential backoff retry.

## Database Models

Account, Room, PlayerSession, BanEntry, Friendship, DirectMessage, BlockEntry, RespectLog, Item, InventoryItem, Purchase, CurrencyTransaction, Quest, QuestCompletion, QuestSubmission, QuestStreak, FishInventory

## API Endpoints

| Route | Purpose |
|-------|---------|
| `/api/auth/*` | Guest auth, Twitter OAuth |
| `/api/social/*` | Friends, DMs, blocks, search, respect |
| `/api/economy/*` | Balance, daily login, transactions |
| `/api/shop/*` | Item listing, inventory, AVAX purchase |
| `/api/wallet/*` | Wallet info, create, withdraw |
| `/api/quest/*` | Available quests, progress, submissions |
| `/api/rooms` | Active rooms with player counts |
| `/admin/api/*` | Admin panel endpoints |

## Smart Contract

- **Contract**: `ItemShop.sol` (Solidity ^0.8.24)
- **Network**: Avalanche Fuji Testnet
- **Security**: OpenZeppelin ReentrancyGuard
- **Functions**: `purchaseItem()`, `getMyPurchases()`, `getPurchaseCount()`, `withdraw()`

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- MetaMask wallet (for AVAX features)

### Environment Variables

**Server** (`server/.env`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/loopia
ADMIN_PASSWORD=
WALLET_ENCRYPTION_KEY=
AVAX_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
DEPLOYER_PRIVATE_KEY=
SHOP_CONTRACT_ADDRESS=
```

**Client** (`client/.env`):
```
VITE_TWITTER_CLIENT_ID=
```

### Run

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
cd ../admin && npm install

# Setup database
cd ../server
npx prisma migrate dev
npx prisma db seed

# Deploy smart contract (optional)
npx hardhat run scripts/deploy.ts --network fuji

# Start development
cd .. && ./start_dev.sh
```

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```
