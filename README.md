# 📈 StockPile

> An AI-powered financial terminal and paper trading platform for retail investors.

**Problem**: Retail traders lack a single, high-performance interface combining real-time market data, AI-driven research, and risk-free paper trading.

**Solution**: StockPile delivers live market feeds, Gemini-powered sentiment analysis, and an interactive paper trading dashboard with a $10M virtual portfolio.

---

## ✨ Core Features

- **Real-Time Market Data** — Live price streams, candlestick & area charts, market breadth indicators, and a scrolling ticker tape.
- **AI Research Insights** — Gemini AI integration for news summarisation, sentiment scoring, and deep-dive stock analysis.
- **Paper Trading Engine** — Risk-free simulated trading with full portfolio analytics, PnL tracking, and allocation breakdowns, synced to Firebase.
- **Edge-Side Rendering** — TanStack Start with SSR deployed on Cloudflare Workers for instant first-paint performance.
- **Advanced Charting** — Interactive Recharts-powered charts with dynamic time-series formatting (1D, 5D, 1M, 6M, YTD, 1Y, ALL).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React + SSR) |
| Styling | Tailwind CSS |
| Database & Auth | Firebase (Firestore + Auth) |
| Deployment | Cloudflare Workers |
| Charting | Recharts |
| Market Data | Twelve Data API |
| AI | Google Gemini API |

---

## 🚀 Getting Started

### Prerequisites
Node.js v18+ and npm.

### 1. Clone
```bash
git clone https://github.com/1divy2/stockpile-terminal.git
cd stockpile-terminal
```

### 2. Install
```bash
npm install
```

### 3. Configure environment
Create a `.env` file in the root:
```env
VITE_TWELVEDATA_API_KEY=your_twelvedata_key
VITE_GEMINI_API_KEY=your_gemini_key

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🌐 Deployment

StockPile is pre-configured for edge deployment via **Cloudflare Workers**.

1. Add all `VITE_` variables to the **Build Variables** section in your Cloudflare project settings.
2. Connect the GitHub repo to Cloudflare via Git Integration.
3. Push to `master` — Cloudflare auto-builds and deploys.

---

## 📄 License

MIT © 2024–2026 Divy.
