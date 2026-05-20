import { getState, updateContact } from './stateStore.js';
import { scoreLead } from './aiScorer.js';
import { forwardLeadIfNeeded } from './forwardEngine.js';
import { config } from '../config.js';

function chatIdToDigits(chatId) {
  // chatId: "919812345678@c.us"
  return String(chatId || '').split('@')[0].replace(/[^\d]/g, '');
}

export function attachReplyListener({ client }) {
  client.on('message', async (message) => {
    try {
      // Ignore outgoing / own messages
      if (message.fromMe) return;
      if (!String(message.from || '').endsWith('@c.us')) return; // skip groups/broadcasts

      const fromDigits = chatIdToDigits(message.from);
      if (!fromDigits) return;

      const state = await getState(config.paths.stateJson);
      const contact = state.contacts[fromDigits];
      if (!contact) return; // only handle contacts from CSV

      const inboundText = message.body || '';

      const updatedAfterInbound = await updateContact(config.paths.stateJson, contact.id, (c) => {
        c.replied = true;
        c.lastInboundAt = new Date().toISOString();
        c.conversation ||= [];
        c.conversation.push({ from: 'lead', text: inboundText, at: new Date().toISOString() });
        return c;
      });

      // If already forwarded, we might not want to re-score every single time they reply
      // or at least we don't attempt to forward again.
      if (updatedAfterInbound.forwarded) {
        // Skip re-scoring to save API calls since lead is already closed/forwarded.
        return;
      }

      // Score
      let verdict = null;
      try {
        verdict = await scoreLead(updatedAfterInbound);
      } catch (e) {
        console.error('[AI] scoring failed:', e?.message || e);
      }

      if (verdict) {
        const updatedAfterScore = await updateContact(config.paths.stateJson, contact.id, (c) => {
          c.leadScore = verdict.score;
          c.leadReason = verdict.reason;
          return c;
        });

        // Forward if needed
        const forwarded = await forwardLeadIfNeeded({ client, contact: updatedAfterScore });
        if (forwarded) {
          await updateContact(config.paths.stateJson, contact.id, (c) => {
            c.forwarded = true;
            return c;
          });
          console.log(`[Forward] forwarded lead ${contact.id} (${verdict.score})`);
        }
      }
    } catch (e) {
      console.error('[Listener] error:', e?.message || e);
    }
  });
}
