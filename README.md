# PublicEye Kenya — v5

Citizen accountability platform for all 47 Kenya counties.

## Stack
- **Client**: React + Vite + Tailwind CSS
- **Server**: Node.js + Express + Socket.io
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT + bcrypt
- **Payments**: M-Pesa Daraja API (STK Push, Pochi, Till)
- **AI**: Auto-pattern detection (cron every 30min)

## Setup

### 1. Clone & install
```bash
# Server
cd server && npm install

# Client  
cd client && npm install
```

### 2. Environment Variables

**server/.env** — copy from `.env.example` and fill:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret
SUPERADMIN_EMAIL=admin@yourapp.co.ke
EMAIL_USER=... EMAIL_PASS=...
MPESA_CONSUMER_KEY=... MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=https://yourdomain/api/support/callback
POCHI_PHONE=254712345678
TILL_NUMBER=552341
```

**client/.env**:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

Server: http://localhost:5000  
Client: http://localhost:5173

## Roles
- **citizen** — Submit reports, vote, chat (county-scoped)
- **countyadmin** — Moderate reports/chat for assigned county
- **superadmin** — Full platform access; auto-assigned via SUPERADMIN_EMAIL

## Key Features
- 🎭 Anonymous reporting (Citizen#XXXX alias)
- 🤖 AI pattern detection (contractor/dept clustering)
- 🗺️ 47-county risk heatmap
- 📡 Whistleblower mode (EACC, DCI, Nation, TI)
- 🔒 SHA-256 evidence locker
- 💬 Real-time county chat rooms (7 rooms via Socket.io)
- 📲 M-Pesa donations (STK Push + Pochi + Till)
- ⛔ Citizen suspension system
- 👑 3-tier role guard middleware

## M-Pesa Setup
1. Register at https://developer.safaricom.co.ke
2. Create app → get Consumer Key/Secret
3. Use sandbox shortcode `174379` for testing
4. Use ngrok for local MPESA_CALLBACK_URL during dev
