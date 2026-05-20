export function buildOpeningMessage(contact) {
  const name = contact.name?.trim() || 'there';
  const property = contact.property_type?.trim();
  const location = contact.location?.trim();

  const propertyPart = property ? ` a ${property}` : ' a property';
  const locationPart = location ? ` in ${location}` : '';

  if (contact.intent === 'buyer') {
    const buyerTemplates = [
      `Hi ${name}, I came across your inquiry about buying${propertyPart}${locationPart}. We have some good options right now — would you be open to a quick chat?`,
      `Hello ${name}, I noticed you're looking for${propertyPart}${locationPart}. We've just got some new listings that might fit what you want. Are you free to discuss?`,
      `Hi ${name}, are you still searching for${propertyPart}${locationPart}? Let me know if you want me to share a handpicked list of available places.`,
      `Good day ${name}! I saw you were looking around for${propertyPart}${locationPart}. Is this still something you're planning? Feel free to reply and I'll send over some choices.`
    ];
    return buyerTemplates[Math.floor(Math.random() * buyerTemplates.length)];
  }

  // seller
  const sellerTemplates = [
    `Hi ${name}, I saw you may be looking to sell${propertyPart}${locationPart}. I can share a quick estimate and buyer demand in your area — are you open to a short call?`,
    `Hello ${name}, I noticed you're considering selling${propertyPart}${locationPart}. We have active buyers looking in this exact area right now. Would you be open to chatting?`,
    `Hi ${name}, thinking about putting your${propertyPart}${locationPart} on the market soon? I'd be happy to provide a no-obligation market evaluation. Let me know if you have a minute.`,
    `Hi ${name}! If you're planning to sell your${propertyPart}${locationPart}, I can show you how to maximize its value. Let me know if you'd like to discuss.`
  ];
  return sellerTemplates[Math.floor(Math.random() * sellerTemplates.length)];
}
