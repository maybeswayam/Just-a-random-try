import { config } from '../config.js';
import { sendMessageToNumber } from './waClient.js';

function formatConversation(contact) {
  const lines = (contact.conversation || []).slice(-12).map((m) => {
    const who = m.from === 'you' ? 'You' : contact.name || 'Lead';
    return `  ${who} → "${m.text}"`;
  });
  return lines.join('\n');
}

export async function forwardLeadIfNeeded({ client, contact }) {
  if (!config.forwardToNumber) return false;
  if (contact.forwarded) return false;
  if (!contact.leadScore) return false;
  if (!config.bot.forwardIfScoreIn.includes(String(contact.leadScore).toUpperCase())) return false;

  const summary =
    `🔥 ${contact.leadScore} LEAD ALERT\n\n` +
    `👤 Name: ${contact.name}\n` +
    `📞 Number: +${contact.number}\n` +
    `🏠 Intent: ${contact.intent}${contact.property_type ? ` | ${contact.property_type}` : ''}${
      contact.location ? ` | ${contact.location}` : ''
    }\n\n` +
    `💬 Conversation:\n${formatConversation(contact)}\n\n` +
    `🤖 AI Verdict: ${contact.leadScore}\n` +
    `📝 Reason: ${contact.leadReason || ''}\n\n` +
    `⏱ Time: ${new Date().toLocaleString()}`;

  await sendMessageToNumber(client, config.forwardToNumber, summary);
  return true;
}

