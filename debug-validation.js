// Debug de la validation directement
function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return { isValid: false, provider: null, formattedNumber: '' };
  }

  // Nettoyer et formater le numéro
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  let formattedNumber = cleanNumber;
  
  // Ajouter le préfixe pays si manquant
  if (!formattedNumber.startsWith('+221') && !formattedNumber.startsWith('221')) {
    formattedNumber = '+221' + formattedNumber;
  } else if (formattedNumber.startsWith('221')) {
    formattedNumber = '+' + formattedNumber;
  }

  // Validation du format
  const phoneRegex = /^\+221[67][0-9]{8}$/;
  const shortRegex = /^[67][0-9]{8}$/;
  
  const isValid = phoneRegex.test(formattedNumber) || shortRegex.test(cleanNumber);
  
  if (!isValid) {
    console.warn(`Invalid phone format: ${phoneNumber} -> ${formattedNumber}`);
    return { isValid: false, provider: null, formattedNumber };
  }
  
  // Si format court valide, utiliser le numéro formaté
  if (shortRegex.test(cleanNumber) && !phoneRegex.test(formattedNumber)) {
    formattedNumber = `+221${cleanNumber}`;
  }

  // Détecter l'opérateur
  const provider = detectProvider(formattedNumber);
  
  return { isValid: true, provider, formattedNumber };
}

function detectProvider(phoneNumber) {
  if (!phoneNumber) return null;

  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+221|221)/, '');
  
  const prefixes = {
    'orange_money': ['77', '78'],
    'mtn_mobile_money': ['70', '75', '76'],
    'moov_money': ['60', '61'],
    'free_money': ['76']
  };

  for (const [provider, providerPrefixes] of Object.entries(prefixes)) {
    if (providerPrefixes.some(prefix => cleanNumber.startsWith(prefix))) {
      return provider;
    }
  }

  // Fallback vers Wave
  if (['60', '61', '70', '75', '76', '77', '78'].some(prefix => cleanNumber.startsWith(prefix))) {
    return 'wave';
  }

  return null;
}

// Tests
const testNumbers = ['771234567', '+221771234567', '701234567', '601234567'];

testNumbers.forEach(num => {
  console.log(`\nTest: ${num}`);
  const result = validatePhoneNumber(num);
  console.log(`Résultat:`, result);
});