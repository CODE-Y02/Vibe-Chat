# 🎥 VibeChat — Next-Gen Anonymous Video & Social

Developed with ❤️ by [CODE-Y02](https://github.com/CODE-Y02/)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Hono](https://img.shields.io/badge/Hono-Framework-orange?style=for-the-badge&logo=hono)](https://hono.dev/)

VibeChat is a premium, privacy-first platform for instant human connection. It combines the thrill of anonymous video matchmaking with the persistence of a modern social network—all secured by client-side AI moderation to ensure a safe, high-quality experience.

---

## 🌟 Key Features

- **⚡ Instant Matchmaking**: Proprietary Redis-backed matchmaking engine that pairs you with a stranger in milliseconds.
- **🛡️ Client-Side AI Moderation**: Real-time NSFW detection using **TensorFlow.js** running 100% on the user's device. No video frames ever touch our servers.
- **🥷 Anti-Abuse Ecosystem**: Automatic quarantine of malicious users into a private "troll pool" based on AI flags and community reports.
- **🤝 Social Integration**: Seamlessly add strangers as friends and transition from anonymous calls to persistent Direct Messages (DMs).
- **🗞️ The Vibe Feed**: A community-driven social feed to share thoughts, vibes, and updates with your connections.
- **💎 Premium Aesthetics**: A fluid, glassmorphic UI built with **Framer Motion 12** and **Tailwind 4** for a top-tier user experience.

---

## 🏗️ Technical Architecture

### 1. Adaptive Matchmaking
Built with high-performance **Redis Lua Scripts**, our matchmaking engine is designed for extreme scale and atomicity. 
- **O(1) Random Matching**: Near-instant pairing with low-latency overhead.
- **Intelligent Skip Logic**: Privacy-focused logic to prevent repetitive or unwanted pairings.
- **Ghost Protection**: Automatic eviction for disconnected users ensures the queue remains active.

### 2. Privacy-First Safety
Moderation is handled at the edge for maximum privacy:
- **Local Inference**: Proprietary moderation logic running via **TensorFlow.js** in the browser.
- **High Performance**: Optimized to run without dropping frames, ensuring a smooth 60fps video feed.
- **Persistent Caching**: Optimized model loading using browser-level storage for instant sub-second initialization.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [Next.js 16.1+](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS 4.0+](https://tailwindcss.com/) + [Framer Motion 12](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) + [TanStack Query v5](https://tanstack.com/query/latest)
- **Real-time**: [Socket.io-client](https://socket.io/) + [WebRTC](https://webrtc.org/)

### **Backend**
- **Runtime**: [Node.js](https://nodejs.org/) with [Hono 4.x](https://hono.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM 6.x](https://www.prisma.io/)
- **Caching/Queue**: [Redis](https://redis.io/)
- **Authentication**: [Next-Auth (Auth.js v5 beta)](https://authjs.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Redis Server
- PostgreSQL Instance

### 1. Clone & Install
```bash
git clone https://github.com/your-username/vibe-chat.git
cd vibe-chat
```

### 2. Setup Environment
Create `.env` files in both `/web` and `/backend` directories using the provided templates.

### 3. Run Development
**Backend (`/backend`):**
```bash
npm install
npm run db:push
npm run dev
```

**Frontend (`/web`):**
```bash
npm install
npm run dev
```

---

## 📈 Scalability & Testing

VibeChat is built for the "Viral Spike". Included in the repository is an **Artillery** load-testing suite to simulate 1,000+ concurrent matchmaking requests.

---

## ⚖️ Legal & Compliance

VibeChat is designed to meet modern privacy standards (GDPR/CCPA compliant):
- **P2P Video**: Video streams are directly encrypted peer-to-peer; they are never proxied or recorded.
- **On-Device Moderation**: AI scanning happens locally. Only anonymous telemetry flags are sent to the backend to prevent abuse.

---

## 📜 License & Copyright

Copyright (c) 2026 VibeChat. All rights reserved.

The source code is provided for architectural review and educational purposes. **Public distribution, commercial use, and unauthorized replication of the matchmaking logic or AI moderation implementation are strictly prohibited.**

See [LICENSE](./LICENSE) for full details.
