import { config } from '../config.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Generates a personalized cold outreach message for a business lead
 * using the OpenRouter API.
 */
export async function generateOutreachMessage(contact) {
  if (!config.openRouter.apiKey) {
    // Fallback if no API key is configured
    return `Hi ${contact.name || 'there'}, I'm a freelance web developer and I think a strong online presence could really help your ${contact.business_type || 'business'}. Would you be open to a quick chat?`;
  }

  const payload = {
    model: config.openRouter.model,
    messages: [
      {
        role: 'system',
        content:
          'You are a young person in India casually messaging a local business owner on ' +
          'WhatsApp. Write a message that sounds like it came from a real person, not a ' +
          'marketer. You are a freelance web developer reaching out directly. Say you came ' +
          'across their business while browsing Google Maps or searching for local ' +
          'businesses in their area, noticed their good reviews, and thought a website ' +
          'could help them get more customers. Never mention friends or family. Sound helpful ' +
          'and genuine, not salesy. Write in conversational Hinglish or simple English. ' +
          'Maximum 90 words. No emojis. No corporate language. End with one soft question.'
      },
      {
        role: 'user',
        content:
          `Write a WhatsApp cold outreach message for:\n` +
          `- Business name: ${contact.name}\n` +
          `- Business type: ${contact.business_type}\n` +
          `- Notable info: ${contact.notable_info}\n` +
          `- Has website: ${contact.has_website}\n` +
          `- Running Google Ads: ${contact.running_ads}\n\n` +
          `The sender found this business on Google Maps while exploring local ` +
          `businesses. Do NOT mention friends, family, or personal needs. The reason ` +
          `for reaching out is purely that the sender noticed a good business with no ` +
          `website and wants to help them grow online.\n\n` +
          `Return only the message text, nothing else.`
      }
    ],
    temperature: 0.7
  };

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      console.log(`[TemplateEngine] Calling model: ${config.openRouter.model}`);
      console.log(`[TemplateEngine] For contact: ${contact.name}`);
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
      const message = (data?.choices?.[0]?.message?.content || '').trim();

      if (!message) {
        throw new Error('Empty response from OpenRouter');
      }

      return message;
    } catch (err) {
      attempt++;
      console.warn(`[TemplateEngine] Attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxAttempts) {
        console.error(`[TemplateEngine] All ${maxAttempts} attempts failed. Using fallback message.`);
        return `Hi ${contact.name || 'there'}, I'm a freelance web developer and I think a strong online presence could really help your ${contact.business_type || 'business'}. Would you be open to a quick chat?`;
      }
      const backoffMs = attempt * 2000;
      console.log(`[TemplateEngine] Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }
}
