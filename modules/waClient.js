import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';

export function createWhatsAppClient() {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'realestate-bot' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    console.log('[WA] authenticated');
  });

  client.on('auth_failure', (msg) => {
    console.error('[WA] auth failure:', msg);
  });

  client.on('ready', () => {
    console.log('[WA] client ready');
  });

  return client;
}

export async function resolveChatId(client, digitsNumber) {
  // digitsNumber: e.g. 919812345678
  const numberId = await client.getNumberId(digitsNumber);
  if (!numberId) return null;
  return numberId._serialized; // e.g. 9198...@c.us
}

export async function sendMessageToNumber(client, digitsNumber, text) {
  const chatId = await resolveChatId(client, digitsNumber);
  if (!chatId) throw new Error(`Number not on WhatsApp or not resolvable: ${digitsNumber}`);
  return client.sendMessage(chatId, text);
}

