// Script de test pour la validation Bictorys
const { BICTORYS_CONFIG } = require('./src/config.ts');

// Simulation de la classe BictorysService pour les tests
class TestBictorysService {
  validatePhoneNumber(phoneNumber) {
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

    // Validation du format - numéros sénégalais: +221 + 9 chiffres (7X XXXXXXX ou 6X XXXXXXX)
    const phoneRegex = /^\+221[67][0-9]{8}$/;
    const isValid = phoneRegex.test(formattedNumber);
    
    if (!isValid) {
      console.warn(`Invalid phone format: ${phoneNumber} -> ${formattedNumber}`);
      return { isValid: false, provider: null, formattedNumber };
    }

    // Détecter l'opérateur
    const provider = this.detectProvider(formattedNumber);
    
    if (!provider) {
      console.warn(`No provider detected for: ${formattedNumber}`);
    }
    
    return { isValid: true, provider, formattedNumber };
  }

  detectProvider(phoneNumber) {
    if (!phoneNumber) {
      return null;
    }

    // Nettoyer le numéro
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+221|221)/, '');
    
    console.log(`Detecting provider for cleaned number: ${cleanNumber}`);
    
    // Préfixes des opérateurs au Sénégal
    const prefixes = {
      'orange_money': ['77', '78'],
      'mtn_mobile_money': ['70', '75', '76'],
      'moov_money': ['60', '61'],
      'free_money': ['76']
    };

    // Détecter l'opérateur principal
    for (const [provider, providerPrefixes] of Object.entries(prefixes)) {
      if (providerPrefixes.some(prefix => cleanNumber.startsWith(prefix))) {
        console.log(`Provider detected: ${provider} for number starting with ${cleanNumber.substring(0, 2)}`);
        return provider;
      }
    }

    // Si aucun opérateur spécifique n'est détecté, utiliser Wave comme fallback
    if (['60', '61', '70', '75', '76', '77', '78'].some(prefix => cleanNumber.startsWith(prefix))) {
      console.log(`Using Wave as fallback provider for: ${cleanNumber.substring(0, 2)}`);
      return 'wave';
    }

    console.warn(`No provider found for number: ${cleanNumber}`);
    return null;
  }
}

// Tests
const service = new TestBictorysService();

const testNumbers = [
  '771234567',      // Orange (court)
  '+221771234567',  // Orange (complet)
  '221771234567',   // Orange (avec préfixe)
  '701234567',      // MTN (court)
  '+221701234567',  // MTN (complet)
  '601234567',      // Moov (court)
  '+221601234567',  // Moov (complet)
  '761234567',      // Free/MTN (court)
  '+221761234567',  // Free/MTN (complet)
  '551234567',      // Invalide
  '77123456',       // Trop court
  '7712345678',     // Trop long
  '',               // Vide
  null              // Null
];

console.log('=== Test de validation des numéros de téléphone ===\n');

testNumbers.forEach((number, index) => {
  console.log(`Test ${index + 1}: "${number}"`);
  try {
    const result = service.validatePhoneNumber(number);
    console.log(`  Résultat: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.log(`  Erreur: ${error.message}`);
  }
  console.log('');
});