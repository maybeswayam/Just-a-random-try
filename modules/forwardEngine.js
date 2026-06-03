import { config } from '../config.js';
import { sendMessageToNumber } from './waClient.js';

function formatConversation(contact) {
  const lines = (contact.conversation || []).slice(-12).map((m) => {
    const who = m.from === 'you' ? 'You' : contact.name || 'Lead';
    return `  ${who} → "${m.text}"`;
  });
  return lines.join('\n');
}

function suggestNextStep(contact) {
  const score = String(contact.leadScore || '').toUpperCase();
  if (score === 'HOT') {
    return '📌 Suggested next step: Schedule call';
  }
  if (score === 'WARM') {
    return '📌 Suggested next step: Send portfolio';
  }
  return '📌 Suggested next step: Follow up in 2-3 days';
}

export async function forwardLeadIfNeeded({ client, contact }) {
  if (!config.forwardToNumber) return false;
  if (contact.forwarded) return false;
  if (!contact.leadScore) return false;
  if (!config.bot.forwardIfScoreIn.includes(String(contact.leadScore).toUpperCase())) return false;

  const summary =
    `🔥 ${contact.leadScore} LEAD ALERT\n\n` +
    `👤 Business: ${contact.name}\n` +
    `🏷 Type: ${contact.business_type || 'N/A'}\n` +
    `📞 Number: +${contact.number}\n` +
    `📋 Notable info: ${contact.notable_info || 'N/A'}\n` +
    `🌐 Has website: ${contact.has_website ? 'Yes' : 'No'}\n` +
    `📢 Running ads: ${contact.running_ads ? 'Yes' : 'No'}\n\n` +
    `🤖 Lead Score: ${contact.leadScore}\n` +
    `📝 Reason: ${contact.leadReason || ''}\n\n` +
    `💬 Conversation:\n${formatConversation(contact)}\n\n` +
    `${suggestNextStep(contact)}\n\n` +
    `⏱ Time: ${new Date().toLocaleString()}`;

  await sendMessageToNumber(client, config.forwardToNumber, summary);
  return true;
}
