# 🩸 Bloodchain [v1.0.0]

**A decentralized, AI-powered, peer-to-peer blood donation platform.**

Bloodchain connects donors and recipients directly, eliminating hospital intermediaries. It uses AI for instant,
high-quality matching and blockchain for transparent, trustless verification of donations, rewarding participants with
tokens and NFT credentials.

---

## ✨ Key Features

* [cite_start]**AI-Powered Matching:** A 10-feature TensorFlow.js model analyzes compatibility,
  distance [cite: 157][cite_start], reputation [cite: 158][cite_start], and fraud risk [cite: 163] to find the best
  donors instantly.
* [cite_start]**Decentralized Verification:** A peer-to-peer network of verifiers can attest to donations, which are
  then recorded immutably on the blockchain.
* [cite_start]**Biometric Identity:** AI-powered facial recognition and liveness detection prevent fraud and ensure user
  identity[cite: 183].
* [cite_start]**Real-time Geolocation:** Donors and recipients can connect in real-time, with donors' live locations
  used for precise, privacy-preserving matching within a specified radius[cite: 19].
* [cite_start]**Tokenized Rewards:** Donors earn ERC-20 tokens for successful donations [cite: 311] [cite_start]and are
  awarded soulbound NFT badges (ERC-721) for achievements[cite: 320].

---

## 🛠️ Tech Stack

* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **Database:** PostgreSQL (with Prisma ORM)
* **Authentication:** NextAuth.js (Google & Credentials)
* **AI/ML:** TensorFlow.js
* **Blockchain:** Ethers.js (Polygon/Solidity)
* **Real-time:** Socket.IO with a Redis Adapter
* **Background Jobs:** Node.js cron jobs
* **Deployment:** Docker Compose, Vercel

---

## 🚀 Production Deployment (Docker)

The recommended way to run Bloodchain in production is with Docker Compose, which manages all required services.

**Prerequisites:**

* Docker & Docker Compose
* Node.js v18+
* `pnpm`

### 1. Environment Setup

Copy the example environment file. You **must** fill this file out with your production keys.

```bash
cp .env.local.example .env.local
```

**Key variables to set in** `.env.local`:

* `DATABASE_URL`: Your PostgreSQL connection string.
*
* `REDIS_URL`: Your Redis connection string.
*
* `NEXTAUTH_SECRET`: A 32-byte secret (openssl rand -base64 32).
*
* `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google OAuth.
*
* `ETHEREUM_RPC_URL`: Your Polygon (or other EVM) RPC endpoint.
*
* `BLOCKCHAIN_SIGNER_PRIVATE_KEY`: Private key of the wallet that will sign transactions and issue rewards.

### 2. Build & Launch

This command will build the Next.js app, the Socket.IO server, and all Docker images, then launch the entire stack in
detached mode.

``` bash
# 1. Install dependencies
pnpm install

# 2. Build the application locally first (for Dockerfile.socket)
pnpm run build

# 3. Launch all services
docker-compose up -d
```

Your services are now running:

* **Next.js App:** `http://localhost:3000`
* **Socket.IO Server:** `http://localhost:3001`
* **PostgreSQL:** `Port 5432`
* **Redis:** `Port 6379`

### 3. Database Migration

After the services are up, run the production database migration.

```bash
# This runs the 'migrate deploy' command inside the 'app' container
docker-compose exec app npx prisma migrate deploy
```

### 4. Train the AI Model

You must train the model once (or load a pre-trained one) for the AI matching to work.

```bash
# This runs the training script inside the 'app' container
docker-compose exec app npx ts-node scripts/train-model.ts
```

Your Bloodchain instance is now live and fully operational.

## 📚 Documentation

* **Software Requirements (SRS):** `BLOODCHAIN_SRS.pdf`
* **API Code Reference:** `BLOODCHAIN_API_CODE.md`
* **Setup Guide:** `BLOODCHAIN_SETUP_GUIDE.md`
* **Contributing:** `docs/CONTRIBUTING.md`