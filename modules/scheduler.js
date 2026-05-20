import { buildOpeningMessage } from './templateEngine.js';
import { sendMessageToNumber } from './waClient.js';
import { getState, updateContact, incrementDailySent } from './stateStore.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function runOutreachBatch({ client, config }) {
  const state = await getState(config.paths.stateJson);

  const pending = Object.values(state.contacts).filter((c) => !c.sent);
  if (pending.length === 0) {
    console.log('[Scheduler] No pending contacts to message.');
    return;
  }

  console.log(`[Scheduler] Pending contacts: ${pending.length}`);

  for (const contact of pending) {
    const latest = await getState(config.paths.stateJson);
    if ((latest.daily?.sentCount || 0) >= config.bot.maxMessagesPerDay) {
      console.log('[Scheduler] Daily limit reached; stopping outreach for today.');
      return;
    }

    const msg = buildOpeningMessage(contact);
    try {
      await sendMessageToNumber(client, contact.number, msg);

      await updateContact(config.paths.stateJson, contact.id, (c) => {
        c.sent = true;
        c.lastOutboundAt = new Date().toISOString();
        c.conversation ||= [];
        c.conversation.push({ from: 'you', text: msg, at: new Date().toISOString() });
        return c;
      });
      await incrementDailySent(config.paths.stateJson);

      console.log(`[Scheduler] Sent to ${contact.name} (${contact.number})`);
    } catch (e) {
      console.error(`[Scheduler] Failed to send to ${contact.number}:`, e?.message || e);
      // do not mark as sent
    }

    const delaySec = randInt(config.bot.minDelaySeconds, config.bot.maxDelaySeconds);
    console.log(`[Scheduler] Waiting ${delaySec}s...`);
    await sleep(delaySec * 1000);
  }
}

export function startScheduler({ client, config }) {
  // Run once immediately, then check periodically.
  runOutreachBatch({ client, config }).catch((e) => console.error('[Scheduler] batch error', e));

  // Check every 10 minutes for new pending contacts (minimum safe schedule).
  const intervalMs = 10 * 60 * 1000;
  setInterval(() => {
    runOutreachBatch({ client, config }).catch((e) => console.error('[Scheduler] batch error', e));
  }, intervalMs);
}

