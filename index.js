import { config } from './config.js';
import { loadContacts } from './modules/csvLoader.js';
import { syncContactsIntoState } from './modules/stateStore.js';
import { createWhatsAppClient } from './modules/waClient.js';
import { attachReplyListener } from './modules/replyListener.js';
import { startScheduler } from './modules/scheduler.js';

async function main() {
  const aiConfig = config.aiProvider.active;
  if (!aiConfig.apiKey) {
    console.warn(`[Config] ${config.aiProvider.provider.toUpperCase()}_API_KEY not set. AI scoring will be disabled.`);
  }
  if (!config.forwardToNumber) {
    console.warn('[Config] FORWARD_TO_NUMBER not set. Forwarding will be disabled.');
  }

  const contacts = await loadContacts(config.paths.contactsCsv);
  console.log(`[Init] Loaded contacts: ${contacts.length}`);
  await syncContactsIntoState(config.paths.stateJson, contacts);

  const client = createWhatsAppClient();
  
  if (process.env.TEST_MODE !== 'true') {
    attachReplyListener({ client });
  } else {
    console.log('[Init] TEST_MODE active — inbound message handling is disabled.');
  }

  client.on('ready', () => {
    startScheduler({ client, config });
  });

  await client.initialize();
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exitCode = 1;
});

