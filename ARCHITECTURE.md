# 🏗️ VibeChat: Technical Architecture & System Design

This document outlines the high-level architecture of VibeChat, focusing on the core "Engine" components that ensure scalability, privacy, and performance.

---

## 1. Atomic Matchmaking Engine (The "Heart")

The matchmaking system is designed to handle thousands of concurrent users without race conditions or bottlenecks.

### Core Stack
- **Redis (ioredis)**: Used as the primary synchronization layer.
- **Lua Scripting**: To ensure atomicity, the matching logic is executed inside a Lua script.

### Matching Logic
Instead of a slow database query, we use a custom Lua script that performs several O(1) operations atomically:
1. **Self-Eviction**: Removes the current user from the queue to prevent self-matching.
2. **Health Check**: Uses `EXISTS` on heartbeat keys to immediately prune offline "ghost" users during the match attempt.
3. **Skip Protection**: Checks an ephemeral Redis Set to ensure users aren't re-matched with someone they just skipped.
4. **Atomic Claim**: Uses `SREM` to "claim" a peer. If the peer is claimed successfully, the match is locked.

---

## 2. Privacy-First Edge AI (The "Guard")

VibeChat uses client-side AI to eliminate server moderation costs and maximize user privacy.

### The Problem
Traditional moderation requires proxying sensitive video streams to a GPU server, which is:
- **Expensive**: GPU cycles cost \$1,000s/month at scale.
- **Non-Private**: Video must be decrypted to be scanned.

### The Solution: On-Device Inference
We bundle **TensorFlow.js** and the **NSFWJS** model (MobileNetV2) directly in the frontend.
- **IndexedDB Caching**: The 25MB model is cached in browser storage on first visit. Subsequent loads take < 300ms.
- **Idle Processing**: Inference loops use `requestIdleCallback`. This ensures that heavy AI processing only happens during browser idle time, maintaining a silky-smooth 60fps video feed.

---

## 3. Real-time Communication (The "Veins")

### Hybrid Signaling & P2P
1. **Signaling**: **Socket.io** (running on **Hono**) handles the initial candidate exchange and handshake.
2. **Direct Media**: Once matched, users connect via **WebRTC (P2P)**. Video data never touches our backend, ensuring zero retention and high privacy.

### Scalability (Redis Adapter)
The Socket.io server is horizontally scalable. By using the **Redis Adapter**, multiple backend instances can synchronize and route signals between users connected to different physical nodes.

---

## 4. Anti-Abuse Ecosystem (The "Filter")

### The Shadowban Queue
Malicious users aren't just banned; they are **Shadowbanned**.
- Their requests are routed to a separate Redis `SHADOWBAN_QUEUE`.
- They only match with other shadowbanned users.
- This creates a "troll pool" while keeping the main community clean and high-quality.

---

## 5. Performance Optimizations

- **Logger Silence**: Configurable `Logger` utility that allows full debugging in dev but 0% overhead in production.
- **Pre-Quantum Cryptography Ready**: Signaling uses standard JWT and TLS, designed to be swapped for PQC-resistant layers as standards emerge.
- **React 19 & Next.js 16**: Utilizing the latest concurrent rendering features to minimize hydration stutters.

---

Developed by [CODE-Y02](https://github.com/CODE-Y02/)
