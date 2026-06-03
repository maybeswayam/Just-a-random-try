# CODEBASE_CONTEXT.md

## 1. Project Overview

This project is an automated WhatsApp outreach bot tailored for freelance web development cold outreach to small businesses in India. It reads business contacts from a CSV file, generates personalized opening messages using an AI model (via OpenRouter) written in Hinglish or English, and sends them via WhatsApp with safe, randomized delays to avoid bans. When a prospect responds, the conversation is tracked and scored by an AI model as HOT, WARM, or COLD. High-quality leads are formatted with a suggested next step and forwarded to a designated WhatsApp number.

## 2. File Structure

- `index.js` — Main entry point; initializes state, dependencies, the WhatsApp client, and event listeners.
- `config.js` — Centralized configuration parsing environment variables and bot limits.
- `package.json` — Defines Node.js module dependencies and project metadata.
- `contacts.csv` — Contains raw contact data (name, number, business_type, notable_info, has_website, running_ads).
- `state.json` — Locally tracks bot execution state, contact status, and conversation history.
- `modules/aiScorer.js` — Prompts an OpenRouter language model to classify lead replies for freelance web dev conversations.
- `modules/csvLoader.js` — Parses and validates `contacts.csv`, mapping business fields and formatting target numbers.
- `modules/forwardEngine.js` — Constructs summary alerts with business info, lead score, conversation history, and suggested next steps, then forwards to an administrator.
- `modules/replyListener.js` — Listens globally for incoming messages, tracks them in state, and triggers lead scoring.
- `modules/scheduler.js` — Sweeps new contacts and dispatches AI-generated opening messages within daily limits.
- `modules/stateStore.js` — Employs a mutex queue paradigm for safely reading/writing the `state.json` file.
- `modules/templateEngine.js` — Generates personalized cold outreach messages via OpenRouter API, tailored to each business lead.
- `modules/waClient.js` — Configures the headless WhatsApp-web.js wrapper and manages authentication via QR codes.

## 3. Core Logic Flow

1. **Startup**: `index.js` invokes `csvLoader` to read the CSV, syncing all valid contacts into a centralized JSON store (`stateStore`).
2. **Authentication**: `waClient.js` launches a headless browser. A QR code is logged to the terminal (`qrcode-terminal`) for the user to link a WhatsApp account.
3. **Outreach Execution**: `scheduler.js` runs periodically, looking for leads in state that haven't been texted. For each lead, it calls `generateOutreachMessage()` in `templateEngine.js`, which sends the lead's details to OpenRouter to produce a personalized Hinglish/English message. Messages are dispatched separated by randomized wait times (`config.bot.delay`).
4. **Inbound Tracking**: Once the bot is live, `replyListener.js` detects inbound text messages, skipping groups or bots. It attaches the text to the lead's tracked conversation list inside `state.json`.
5. **AI Scoring**: Upon receiving a reply, the entire dialogue stack is sent to an LLM asynchronously (`aiScorer.js`). The model evaluates the conversation between a freelance web developer and a small business owner, returning a JSON output of `{ "score": "HOT|WARM|COLD", "reason": "..." }`.
6. **Lead Forwarding**: If the updated score meets the desired criteria (e.g., 'HOT'), `forwardEngine.js` composes a comprehensive summary (business info, notable details, chat history, AI verdict, and a suggested next step like "Send portfolio" or "Schedule call") and pushes it to the central `FORWARD_TO_NUMBER`.

## 4. Key Functions

- **`loadContacts(csvPath)`** *(in csvLoader.js)*
  - **What it does**: Reads and normalizes row data mapping names, 10-digit sanitized phone numbers, business type, notable info, and boolean flags for website/ads.
  - **Parameters**: `csvPath` (String).
  - **Returns**: `[{ id, name, number, business_type, notable_info, has_website, running_ads }]` Array.
- **`generateOutreachMessage(contact)`** *(in templateEngine.js)*
  - **What it does**: Calls OpenRouter API with the lead's business details to generate a personalized cold outreach message in Hinglish or English. Includes retry logic with exponential backoff and a sensible fallback message.
  - **Parameters**: `contact` (Object with name, business_type, notable_info, has_website, running_ads).
  - **Returns**: `Promise<String>` — the generated message text.
- **`scoreLead(contact)`** *(in aiScorer.js)*
  - **What it does**: Evaluates a multi-turn chat sequence calling the OpenRouter API, classifying a freelance web dev conversation. Uses robust JSON extraction to handle unformatted response code fences.
  - **Parameters**: `contact` (Object including previous conversation strings and business details).
  - **Returns**: `{ score: String, reason: String }` object or `null`.
- **`forwardLeadIfNeeded({ client, contact })`** *(in forwardEngine.js)*
  - **What it does**: Decides if a lead meets the target forward value. Builds a detailed summary including business name/type, notable info, website/ads status, lead score, conversation history, and a suggested next step. Forwards to `FORWARD_TO_NUMBER`.
  - **Parameters**: `{ client, contact }` (WA client instance and target state object).
  - **Returns**: Boolean indicating if the message was forwarded.
- **`runOutreachBatch({ client, config })`** *(in scheduler.js)*
  - **What it does**: Gathers uncontacted leads safely locked in state. Awaits `generateOutreachMessage()` for each lead to get an AI-generated message. Throttles calls via random delays bounded by configs, and terminates logic if the daily limit is reached.
  - **Parameters**: `{ client, config }`.
  - **Returns**: A Promise to execute outreach.
- **`updateContact(statePath, contactId, updater)`** *(in stateStore.js)*
  - **What it does**: Synchronously isolates an atomic JSON read/apply/write routine bypassing synchronous multi-promise race conditions.
  - **Parameters**: `statePath` (String route), `contactId` (String key), `updater` (Callback function).
  - **Returns**: The modified contact object mapping.

## 5. Dependencies & Libraries

- `whatsapp-web.js`: An unofficial API that injects and modifies scripts on WhatsApp Web through Puppeteer. Facilitates message reception and dispatch.
- `qrcode-terminal`: Required to render visual terminal blocks reflecting WhatsApp connection QR codes out to the parent terminal window.
- `dotenv`: Bootstraps secret management; parsing the `.env` settings directly into Node's execution context.

## 6. Data Formats

- **CSV Format (`contacts.csv`)**: Business lead data with the following columns.
  *Columns*: `name, number, business_type, notable_info, has_website, running_ads`
  *Example*: `Sharma Home Decor,919XXXXXXXXX,home decor,great Google reviews,no,no`
- **Application State (`state.json`)**: Key-Value mapping dictating metadata, daily throttling limitations, and nested per-contact configurations.
  *Example*:

  ```json
  {
    "daily": {
      "date": "2026-06-03",
      "sentCount": 1
    },
    "contacts": {
      "919XXXXXXXXX": {
        "id": "919XXXXXXXXX",
        "name": "Sharma Home Decor",
        "number": "919XXXXXXXXX",
        "business_type": "home decor",
        "notable_info": "great Google reviews",
        "has_website": false,
        "running_ads": false,
        "sent": true,
        "replied": true,
        "conversation": [
          { "from": "you", "text": "Hi Sharma Home Decor, I noticed your great Google reviews...", "at": "2026-06-03T10:00:00.000Z" },
          { "from": "lead", "text": "Yes tell me more", "at": "2026-06-03T10:15:00.000Z" }
        ],
        "leadScore": "HOT",
        "leadReason": "Lead expressed direct interest and asked for details.",
        "forwarded": true
      }
    }
  }
  ```

## 7. Environment Variables

- `OPENROUTER_API_KEY`: API token used to execute inferences on OpenRouter's hosted LLM instances (used for both message generation and lead scoring).
- `OPENROUTER_MODEL`: Identifier for the requested model. Defaults to `meta-llama/llama-3.1-8b-instruct:free`.
- `OPENROUTER_BASE_URL`: Optionally overwrites OpenRouter endpoint roots in case of domain/VPN redirections.
- `FORWARD_TO_NUMBER`: The exact receiving 10-14 digit recipient admin phone number. No '+' symbol (e.g. 919876543210).
- `MIN_DELAY_SECONDS`: Lower limit (in seconds) for randomized delay between messages. Default: 45.
- `MAX_DELAY_SECONDS`: Upper limit (in seconds) for randomized delay between messages. Default: 90.
- `MAX_MESSAGES_PER_DAY`: Daily hard cutoff limit to prevent aggressive sending. Default: 35.
- `FORWARD_IF_SCORE_IN`: Comma-separated list of lead scores to forward. Default: `HOT`.

## 8. Current Limitations

- **State Scalability**: Using serialized `JSON.stringify` within atomic files limits scalability. When handling intervals over a hundred leads, memory and concurrent I/O IOPS will lock thread iterations.
- **Fixed Conversation Cutoffs**: `replyListener.js` completely omits executing evaluation scoring steps once the `.forwarded` state is true (`if(updatedAfterInbound.forwarded) return;`), limiting post-forward interactions.
- **Dependency Reliability**: Because this relies on DOM manipulation over Puppeteer utilizing WhatsApp Web, headless changes pushed by WhatsApp can unexpectedly break messaging execution code blocks.
- **API Dependency for Outreach**: Opening messages are generated via OpenRouter API. If the API is down or rate-limited, the bot falls back to a generic message template.

## 9. Integration Points

- **WhatsApp Interface Node**: Binds globally through `Puppeteer` via `waClient.js`. Generates headless authentication contexts allowing dispatch instructions (`client.sendMessage()`) to trigger backend socket interactions inside the emulator.
- **OpenRouter Endpoint**: Used in two modules:
  - `templateEngine.js`: Generates personalized cold outreach messages for each business lead.
  - `aiScorer.js`: Scores lead conversations as HOT/WARM/COLD based on engagement level.
  Both use the standard System/User instructional block format via native `fetch`.
