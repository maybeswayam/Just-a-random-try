export function buildOpeningMessage(contact) {
  const name = contact.name?.trim() || 'there';
  const property = contact.property_type?.trim();
  const location = contact.location?.trim();

  const propertyPart = property ? ` a ${property}` : ' a property';
  const locationPart = location ? ` in ${location}` : '';

  if (contact.intent === 'buyer') {
    return `Hi ${name}, I came across your inquiry about buying${propertyPart}${locationPart}. We have some good options right now — would you be open to a quick chat?`;
  }

  // seller
  return `Hi ${name}, I saw you may be looking to sell${propertyPart}${locationPart}. I can share a quick estimate and buyer demand in your area — are you open to a short call?`;
}

