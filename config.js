import 'dotenv/config';

/**
 * NOTE:
 * - Do NOT hardcode secrets in this repo. Use `.env`.
 * - WhatsApp number formats:
 *   - Contacts in CSV: E.164 preferred (e.g. +919812345678) or digits only (919812345678)
 *   - Forward target in env: digits only (e.g. 919812345678)
 */

export const config = {
  // AI Provider configuration
  aiProvider: {
    // Gemini
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash'
    },
    // OpenRouter (legacy support)
    openRouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_MODEL || 'openrouter/free'
    },
    // Which provider to use
    provider: process.env.AI_PROVIDER || 'gemini',
    // Get active provider config
    get active() {
      return this[this.provider] || this.gemini;
    }
  },

  // WhatsApp forwarding destination (digits only, include country code)
  forwardToNumber: (process.env.FORWARD_TO_NUMBER || '').trim(),

  // Bot behavior
  bot: {
    // outreach pacing
    minDelaySeconds: Number(process.env.MIN_DELAY_SECONDS || 45),
    maxDelaySeconds: Number(process.env.MAX_DELAY_SECONDS || 90),
    // conservative limits to reduce ban risk
    maxMessagesPerDay: Number(process.env.MAX_MESSAGES_PER_DAY || 35),
    // forward threshold: HOT only by default
    forwardIfScoreIn: (process.env.FORWARD_IF_SCORE_IN || 'HOT')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  },

  // Files
  paths: {
    contactsCsv: process.env.CONTACTS_CSV || './contacts.csv',
    stateJson: process.env.STATE_JSON || './state.json'
  },

  // Scoring prompt
  scoring: {
    systemPrompt:
      process.env.SCORING_SYSTEM_PROMPT ||
      [
        'Evaluate this WhatsApp conversation between a freelance web developer and a small business owner.',
        'Classify the lead as:',
        '- HOT: actively interested, asked questions, or agreed to a call',
        '- WARM: politely engaged but not committed',
        '- COLD: ignored, refused, or gave a one-word reply',
        'Return STRICT JSON only with keys: score, reason.',
        'score must be one of: HOT, WARM, COLD.',
        'reason must be a single short sentence.'
      ].join('\n')
  }
};

