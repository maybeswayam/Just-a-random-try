import { config } from '../config.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripCodeFences(s) {
  if (!s) return s;
  return s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export async function scoreLead(contact) {
  if (!config.openRouter.apiKey) {
    console.warn('[AI] OPENROUTER_API_KEY missing; skipping scoring.');
    return null;
  }

  const convo = (contact.conversation || [])
    .map((m) => `${m.from === 'you' ? 'You' : contact.name || 'Lead'}: ${m.text}`)
    .join('\n');

  const payload = {
    model: config.openRouter.model,
    messages: [
      { role: 'system', content: config.scoring.systemPrompt },
      {
        role: 'user',
        content:
          `Contact:\n` +
          `Name: ${contact.name}\n` +
          `Business type: ${contact.business_type || ''}\n` +
          `Notable info: ${contact.notable_info || ''}\n` +
          `Has website: ${contact.has_website}\n` +
          `Running ads: ${contact.running_ads}\n\n` +
          `Conversation:\n${convo}\n\n` +
          `Return JSON only.`
      }
    ],
    temperature: 0.2
  };

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const res = await fetch(`${config.openRouter.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${text}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      const cleaned = stripCodeFences(content);

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Try extracting first {...} block
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      const score = String(parsed?.score || '').toUpperCase().trim();
      const reason = String(parsed?.reason || '').trim();
      if (!['HOT', 'WARM', 'COLD'].includes(score) || !reason) {
        throw new Error(`Invalid scorer output: ${cleaned}`);
      }

      return { score, reason };
    } catch (err) {
      attempt++;
      console.warn(`[AI] Attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxAttempts) {
         console.error(`[AI] All ${maxAttempts} attempts to score lead failed.`);
         return null;
      }
      const backoffMs = attempt * 2000; // 2s, 4s
      console.log(`[AI] Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }
}
