# F.R.I.D.A.Y. — Emergency Mission Control Demo & Deployment Guide

## 1. Overview
F.R.I.D.A.Y. (**Flying Relay Infrastructure for Dynamic Area**) is an emergency mission control system designed for disaster response. In this deployment-ready version, **Base Station Alpha (0xFA)** and **Base Station Charlie (0xFF)** operate with independent station logins and communicate bidirectionally in real-time over Supabase PostgreSQL WebSockets, simulating long-range SX1262 LoRa transmission through an aerial drone relay.

---

## 2. Supabase Cloud Setup (2 Minutes)

Your project uses Supabase at:
**`https://qgzswuytdfekjdqfxgsb.supabase.co`**

### Step A: Run the SQL Migration
1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/qgzswuytdfekjdqfxgsb](https://supabase.com/dashboard/project/qgzswuytdfekjdqfxgsb)
2. Go to the **SQL Editor** on the left navigation.
3. Click **New Query** and copy & paste the contents of **[`supabase/schema.sql`](supabase/schema.sql)**.
4. Click **Run**. This creates:
   - `messages`: Multi-station persistent ledger with `category`, `delivery_status`, `ack_status`, and `created_at`.
   - `station_credentials`: Salted cryptographic hashes for Base Station A and C.
   - `system_setup`: Flag preventing repeated password resets across reloads.
   - Enables **Supabase Realtime** on the `messages` table for instant live updates.

### Step B: Get Your Public/Anon API Key
1. In Supabase, go to **Project Settings** → **API**.
2. Copy the **Project API Key** labelled `anon` / `public`.

---

## 3. Local Testing & Verification

1. In `friday-dashboard/.env` (or via the interactive screen):
   ```env
   VITE_SUPABASE_URL=https://qgzswuytdfekjdqfxgsb.supabase.co
   VITE_SUPABASE_ANON_KEY=your_copied_anon_key_here
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`.
4. **First-Time Setup Flow**:
   - The system securely generates high-entropy passwords for **Base Station Alpha** (`FRIDAY-ALPHA-...`) and **Base Station Charlie** (`FRIDAY-CHARLIE-...`).
   - Copy both passwords.
   - Click **"Store Salted Hashes & Proceed to Login"**.
5. **Two-Laptop / Two-Window Realtime Demo**:
   - **Window 1 (Incognito)**: Select **Base Station Alpha**, enter the Alpha password, and click Authenticate.
   - **Window 2 (Normal)**: Select **Base Station Charlie**, enter the Charlie password, and click Authenticate.
   - In Window 1 (Base A), dispatch an **SOS Emergency** or type a message and click **Send Message**.
   - In Window 2 (Base C), watch the incoming message appear **instantly in real time without refreshing**.
   - In Window 2 (Base C), click **"Transmit Verified ACK to Base A"** or send a reply.
   - In Window 1 (Base A), observe the verified ACK and reply appear live!

---

## 4. Vercel Production Deployment

### 1-Click Git Import:
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log into [https://vercel.com](https://vercel.com).
3. Click **"Add New..."** → **"Project"** and select `Rahulkrishh18/com_proj`.
4. **Build & Output Settings**:
   - Vercel automatically detects the root `vercel.json` and Vite framework.
   - Build Command: `npm run build`
   - Output Directory: `friday-dashboard/dist`
5. **Environment Variables**:
   Under **Project Settings** → **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: `https://qgzswuytdfekjdqfxgsb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: *(Your Supabase anon public key)*
6. Click **Deploy**.

---

## 5. Security & Modular Architecture
- **No Plaintext Passwords**: Passwords are never stored plaintext; only salted SHA-256 hashes generated with Web Crypto randomness are saved in PostgreSQL.
- **Hardware Abstraction**: Message handlers use the `CloudMessage` interface, which maps 1-to-1 with the ESP32 SX1262 LoRa packet structures (`0xFA` and `0xFF` sync words), allowing seamless transition to physical serial/Python gateways without modifying UI components.
