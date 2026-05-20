<div align="center">

# 🏠 WhatsApp Real Estate Outreach Bot

**Automated WhatsApp outreach with AI-powered lead scoring and instant forwarding**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![whatsapp-web.js](https://img.shields.io/badge/whatsapp--web.js-1.23-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://github.com/pedroslopez/whatsapp-web.js)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-6366f1?style=flat-square)](https://openrouter.ai)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## What It Does

You drop a CSV of contacts (name, number, buyer/seller intent) and this bot handles everything:

1. **Sends personalized opening messages** with randomized delays to avoid detection
2. **Monitors all replies** and matches them back to your contact list
3. **Scores each conversation** via AI (HOT / WARM / COLD)
4. **Forwards a clean summary** to your designated WhatsApp number when a HOT lead is detected — instantly

---

## Architecture

```
contacts.csv
     │
     ▼
┌─────────────────┐
│  csvLoader.js   │  Normalize numbers · dedupe · validate intent
└────────┬────────┘
         │
         ▼
┌─────────────────┐         ┌──────────────┐
│  stateStore.js  │◄───────►│  state.json  │  Async lock · atomic writes
└────────┬────────┘         └──────────────┘
         │
         ▼
┌─────────────────┐
│   waClient.js   │◄───────► WhatsApp (QR auth · LocalAuth session)
└────────┬────────┘
         │
   ┌─────┴──────┐
   │            │
   ▼            ▼
OUTREACH     LISTEN
   │            │
   ▼            ▼
┌──────────┐  ┌──────────────────┐
│scheduler │  │ replyListener.js │
│   .js    │  │ CSV-scoped only  │
└──────────┘  └────────┬─────────┘
   │                   │
   ▼                   ▼
┌──────────────┐  ┌──────────────┐
│templateEngine│  │  aiScorer.js │  HOT / WARM / COLD
│  4 variants  │  │  w/ backoff  │
└──────────────┘  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────────┐
                  │ forwardEngine.js │  HOT only · no duplicate forward
                  └──────┬───────────┘
                         │
                         ▼
                  📱 Designated number
```

---

## Contact State Flow

```
PENDING ──► SENT ──► REPLIED ──► SCORED ──► [HOT]  → FORWARDED ✅
                                          └─► [WARM/COLD] → IGNORED 🔇
```

Each contact is tracked with full conversation history and only forwarded once.

---

## Project Structure

```
whatsapp-realestate-bot/
├── index.js                 # Orchestrator
├── config.js                # Central config (reads .env)
├── contacts.csv             # Your contact list
├── .env.example             # Template for secrets
├── .gitignore               # state.json excluded
└── modules/
    ├── csvLoader.js         # Parse, normalize, dedupe contacts
    ├── stateStore.js        # JSON persistence + async write lock
    ├── templateEngine.js    # 4 message variants per buyer/seller
    ├── waClient.js          # whatsapp-web.js + LocalAuth
    ├── scheduler.js         # Outreach pacing + concurrency guard
    ├── replyListener.js     # Inbound handler + lead pipeline
    ├── aiScorer.js          # OpenRouter scoring w/ retry backoff
    └── forwardEngine.js     # Format + forward HOT leads
```

---

## Quick Start

### 1. Install

```bash
git clone https://github.com/maybeswayam/Whatsapp-automation-bot.git
cd Whatsapp-automation-bot
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENROUTER_API_KEY=your_key_here
FORWARD_TO_NUMBER=918979909409        # digits only, no + or spaces

# Optional tuning
MIN_DELAY_SECONDS=45
MAX_DELAY_SECONDS=90
MAX_MESSAGES_PER_DAY=35
FORWARD_IF_SCORE_IN=HOT
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### 3. Prepare contacts

Edit `contacts.csv`:

```csv
name,number,intent,property_type,location
Rahul Sharma,+91 98765 43210,buyer,2BHK,Noida
Priya Singh,919876543211,seller,villa,Gurgaon
Amit Verma,+91-9123456789,buyer,,Delhi
```

Required columns: `name`, `number`, `intent` (`buyer` or `seller`)
Optional columns: `property_type`, `location`

Numbers are auto-normalized — `+91 987...`, `91987...`, or `9876543210` all work.

### 4. Run

```bash
npm start
```

On first run, scan the QR code in terminal using **WhatsApp → Linked Devices → Link a device**.
After that, session persists automatically.

---

## How the AI Scoring Works

Every inbound reply triggers an OpenRouter API call with the full conversation context.

The model returns a structured verdict:

```json
{
  "score": "HOT",
  "reason": "Prospect asked about price and requested a site visit"
}
```

**HOT** → forwarded immediately with full conversation summary  
**WARM / COLD** → logged, no forward  

Once a lead is forwarded, subsequent messages from that contact are stored but not re-scored — saving API credits.

---

## Forwarded Message Format

When a HOT lead is detected, your designated number receives:

```
🔥 HOT LEAD ALERT

👤 Name: Rahul Sharma
📞 Number: +919876543210
🏠 Intent: Buyer | 2BHK | Noida

💬 Conversation:
  You → "Hi Rahul, I came across your inquiry about buying a 2BHK in Noida..."
  Rahul → "Yes I'm interested, what's the budget range?"
  You → "We have options between ₹45L–₹65L depending on the floor"
  Rahul → "Can I visit this Saturday?"

🤖 AI Verdict: HOT
📝 Reason: Prospect asked about price and requested a site visit

⏱ Time: 20 May 2026, 4:32 PM
```

---

## Safety & Anti-Ban Controls

| Control | Value | Purpose |
|---|---|---|
| Message delay | 45–90s random | Mimics human typing cadence |
| Daily cap | 35 messages/day | Stays well under WA limits |
| Concurrency guard | `isRunning` flag | Prevents double-sends on restart |
| Contact scope | CSV-only | Ignores messages from unknown numbers |
| Session persistence | `LocalAuth` | Avoids repeated QR scans |
| Template variants | 4 per intent | Reduces identical-message detection |

> **Recommended:** Use a dedicated SIM/number for the bot rather than your personal number.

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | — | **Required.** Your OpenRouter API key |
| `FORWARD_TO_NUMBER` | — | **Required.** Digits-only number to receive lead alerts |
| `MIN_DELAY_SECONDS` | `45` | Minimum delay between outreach messages |
| `MAX_DELAY_SECONDS` | `90` | Maximum delay between outreach messages |
| `MAX_MESSAGES_PER_DAY` | `35` | Daily outreach cap (resets at midnight) |
| `FORWARD_IF_SCORE_IN` | `HOT` | Comma-separated scores that trigger forwarding |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.1-8b-instruct:free` | Model for lead scoring |

---

## Recommended Next Steps

- [ ] **Opt-out handling** — detect keywords like "STOP" and flag contact as do-not-contact
- [ ] **Negative reply throttling** — back off if someone replies rudely or asks to be removed  
- [ ] **SQLite migration** — replace JSON store for better concurrency at 100+ contacts
- [ ] **Dry-run mode** — preview what messages would be sent without actually sending
- [ ] **Dashboard** — simple web UI to see contact status, scores, and conversation history

---

## Tech Stack

- **[whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)** — WhatsApp Web automation via Puppeteer
- **[OpenRouter](https://openrouter.ai)** — Unified LLM API for lead scoring
- **Node.js ESM** — Native ES modules throughout
- **JSON state** — Simple file-based persistence with async write locking

---

<div align="center">
  Built for real estate outreach automation · Use responsibly
</div>
